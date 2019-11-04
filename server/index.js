const _ = require('lodash')
const fs = require('fs')

const DBConnectors = require('./lib/connectors')
const DatumFactory = require('./lib/core/datum-factory')
const Service = require('@ignitial/iio-services').Service

const utils = require('@ignitial/iio-services').utils
const pino = require('./lib/utils').pino

const config = require('./config')

// minimal data for initial populate
const roles = require('./data/minimal-roles')
const adminUser = require('./data/admin')

class DLake extends Service {
  constructor(options) {
    super(options)

    // data connector
    this._options.dbConnector = this._options.dbConnector || { mongo: {} }

    // default to first in the dico (normally unique)
    this._connectorType = Object.keys(this._options.dbConnector)[0]

    // normalize port value
    this._options.server.port = parseInt(this._options.server.port)

    let connectorOptions = Object.assign({}, _.cloneDeep(this._options))

    // connector name matches type and current service name
    connectorOptions.name = this._name + ':' + this._connectorType
    // sets HTTP server port for connector service
    connectorOptions.server.port -= 1
    // inhibits heart beat for sub-services
    delete connectorOptions.heartbeatPeriod
    // remove public options: no specific UI for data items
    delete connectorOptions.publicOptions

    this._dbConnector =
      new DBConnectors[this._connectorType](connectorOptions)

    // datum references
    this.data = {}

    // wait for service to be ready in order to initialize it
    utils.waitForPropertySet(this._dbConnector, '_ready', true).then(async () => {
      // load datum instances
      for (let datum of this._options.data) {
        await this.addDatum(datum.name, datum.options)
      }

      // initialize the service
      this._init(async () => {
        if (this._options.populate) {
          await this._populate()
        }
      }).then(() => {
        pino.info('initialization done for dlake service named [%s] version [%s]',
          this._name, this._packageJson.version)
      }).catch(err => {
        pino.error(err, 'initialization failed')
        process.exit(1)
      })
    }).catch(err => {
      pino.error(err, 'service not ready on time')
      process.exit(1)
    })
  }

  async _populate() {
    let query = {}
    query[this.data.users._options.idName] = 'admin'

    try {
      await utils.waitForPropertyInit(this.data, 'users')

      let admin = await this.data.users._rawCollection.findOne(query)
      let adminRole = await this._ac.getUserRole('admin')

      if (!admin || !adminRole) {
        for (let role in roles) {
          await this._ac.setGrants(role, roles[role])
        }

        await this._ac.setUserRole('admin', 'admin')
        await this._ac.syncGrants()

        for (let datum in this.data) {
          await this.data[datum]._ac.syncGrants()
        }

        // test
        let tmpGrants = this._ac.rolePermission('__privileged__', 'dlake:users', 'readOwn')
        //
        await this.data.users._rawCollection.insertOne(adminUser)
        pino.warn('minimal populate done')
      } else {
        pino.warn('minimal populate ALREADY existing')
      }
    } catch (err) {
      pino.error(err, 'failed to auto-populate data')
    }
  }

  /* ------------------------------------------------------------------------
      update grants for datum
     ------------------------------------------------------------------------ */
  _updateGrantsForDatum(role, datum, grants) {
    return new Promise(async (resolve, reject) => {
      if (!this._ac) {
        reject(new Error('service has not access control'))
        return
      }

      if (!role) {
        reject(new Error('missing role'))
        return
      }

      try {
        let roleData = await this._ac.getGrants(role)
        roleData = roleData || {}

        // deletes only if indicates null
        if (grants === null) {
          delete roleData[datum]
        } else {
          // MERGE with existing: DOES NOT OVERWRITE
          roleData[datum] = { ...roleData[datum], ...grants }
        }

        await this._ac.setGrants(role, roleData)
        await this._ac.syncGrants()

        resolve(datum)
      } catch (err) {
        reject(err)
      }
    })
  }

  /*
   * update roles as per an input dictionary: same format as roles config
       Ex:
       grants: {
         'uberrole': {
           'dlake:mydatum': {
             'create:any':...
           }
         }
       }

       ...
       this._ac.setGrants('uberrole', {
         'dlake:mydatum': {
           'create:any':...
         }
       })
   */
  _updateRolesAndGrands(rag) {
    return new Promise(async (resolve, reject) => {
      try {
        for (let role in rag) {
          for (let datum in rag[role]) {
            await this._updateGrantsForDatum(role, datum, rag[role][datum])
          }
        }

        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  /*
   * add new Datum sub-service to current data service
   * - can be done remotely
   * - updates related grants
   */
  addDatum(name, options, grants) {
    return new Promise(async (resolve, reject) => {
      // console.log('--DATUM--', name, options)
      if (!name) {
        reject(new Error('missing datum name'))
        return
      }

      if (this.data[name]) {
        reject(new Error('datum already defined'))
        return
      }

      let extendedName = this._name + ':' + name

      try {
        options = options || {}

        // get services options from parent configuration
        options = Object.assign({}, _.cloneDeep(options),
          _.cloneDeep(this._options))

        options.name = extendedName

        options.server.port =
          this._options.server.port + Object.keys(this.data).length + 1

        // inhibits heart beat for sub-services
        delete options.heartbeatPeriod
        // remove public options: no specific UI for data items
        delete options.publicOptions

        let Datum = (new DatumFactory()).getDatumClass(this._connectorType)

        Datum.prototype.$app = this
        Datum.prototype.$data = this.data
        this.data[name] = new Datum(options)
        await this.data[name]._init()

        if (options.indexes) {
          // console.log(name, 'DATUM INDEXES', options.indexes)
          for (let index of options.indexes) {
            let idxKey = {}
            idxKey[index.key] = index.type
            try {
              // console.log('--- try to create index [%s] for datum [%s]', index.key, name, index.options)
              await this.data[name].createIndex(idxKey, index.options, grants)

              // console.log('--- created index [%s] for datum [%s]', index.key, name)
            } catch (err) {
              pino.error(err, 'failed to create index %s for %s', index.key, name)
            }
          }
        }

        if (options.grants) {
          // TBD: check that roles grants correspond to current datum
          await this._updateRolesAndGrands(options.grants)
          pino.warn('grants have been updated as per datum [%s] config when datum added', name)
        }

        pino.info('deployed datum service [%s] with port [%s]', extendedName,
          options.server.port)

        console.log('--DATUM-- deployed datum service [%s] with port [%s]', extendedName,
          options.server.port)
        resolve()
      } catch (err) {
        pino.error(err, 'datum creation failed')
        reject(err)
      }
    })
  }

  /*
   * remove datum sub-service from current data service
   * - can be done remotely
   */
  removeDatum(name) {
    return new Promise((resolve, reject) => {
      this.data[name]._destroy().then(() => {
        delete this.data[name]
      }).catch(err => reject(err))
    })
  }

  /*
   * get roles as per an input dictionary: same format as config
   * - can be done remotely
   */
  getRolesAndGrants() {
    /* @_GET_ */
    return this._ac.getRolesAndGrants()
  }

  /* _destroy called automatically for all services: no need to do it */
}

if (require.main === module) {
  // instantiate service with its configuration
  let dlake = new DLake(config)
  let options = _.cloneDeep(dlake._options)
  if (options.dbConnector.mongo) {
    options.dbConnector.mongo.password = '<obfuscated>'
  }

  if (process.env.IIOS_DLAKE_SHOW_OPTIONS) {
    console.log('dlake [%s] service initialization with options [%o]',
      dlake._packageJson.version, options)
  } else {
    console.log('dlake [%s] service initialization done',
      dlake._packageJson.version)
  }
} else {
  exports.DLake = DLake
}
