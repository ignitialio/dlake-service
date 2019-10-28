const _ = require('lodash')

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
      this._init().then(async () => {
        await this._populate()
        pino.info('initialization done for dlake service named [%s]', this._name)
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

      if (!admin) {
        for (let role in roles) {
          await this._ac.setGrants(role, roles[role])
        }

        await this._ac.setUserRole('admin', 'admin')
        await this.data.users._rawCollection.insertOne(adminUser)
        pino.warn('minimal populate done')
      } else {
        pino.warn('minimal populate ALREADY existing')
      }
    } catch (err) {
      pino.error(err, 'failed to auto-populate data')
    }
  }

  addDatum(name, options, grants) {
    return new Promise(async (resolve, reject) => {
      console.log('--DATUM--', name, options)
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

        pino.info('deployed datum service [%s] with port [%s]', extendedName,
          options.server.port)

        console.log('deployed datum service [%s] with port [%s]', extendedName,
          options.server.port)
        resolve()
      } catch (err) {
        pino.error(err, 'datum creation failed')
        reject(err)
      }
    })
  }

  removeDatum(name) {
    return new Promise((resolve, reject) => {
      this.data[name]._destroy().then(() => {
        delete this.data[name]
      }).catch(err => reject(err))
    })
  }

  updateGrants(role, datum, grants) {
    return new Promise(async (resolve, reject) => {
      if (!(role && datum)) {
        reject(new Error('missing grants update info'))
        return
      }

      try {
        let extendedName = this._name + ':' + datum
        let roleData = await this._ac.getGrants(role)

        if (!grants) {
          delete roleData[extendedName]
        } else {
          roleData[extendedName] = grants
        }

        await this._ac.setGrants(role, roleData[extendedName])
        pino.warn('update grants for role [%s]', role)

        await this._ac.syncGrants()

        resolve(roleData[extendedName])
      } catch (err) {
        reject(err)
      }
    })
  }

  /* update roles as per an input dictionary: same foramt as config */
  updateDatumRoles(roles) {
    return new Promise(async (resolve, reject) => {
      for (let role in roles) {
        for (let datum in roles[role]) {
          await this.updateGrants(role, datum, roles[role][datum])
        }
      }
    })
  }

  /* _destroy called automatically for all services: no need to do it */
}

if (require.main === module) {
  // instantiate service with its configuration
  let dlake = new DLake(config)
  let options = _.cloneDeep(dlake._options)
  if (options.dbConnector.mongo) {
    delete options.dbConnector.mongo.password
  }

  console.log('dlake service initialization with options', dlake._options)
} else {
  exports.DLake = DLake
}
