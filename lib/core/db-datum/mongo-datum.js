const Cursor = require('mongodb').Cursor

const Datum = require('../datum')
const utils = require('@ignitial/iio-services').utils

const pino = require('../../utils').pino

class MongoDatum extends Datum {
  constructor(options) {
    super(options)

    pino.info('created datum [' + options.name + '] with options', options)
  }

  /* initialize */
  async _init() {
    try {
      // wait for mongo property ready
      this._mongo = await utils.waitForPropertyInit(this.$app, '_dbConnector')

      // wait for db connection in data center conditions
      await utils.waitForPropertyInit(this._mongo, '_ready', 86400000)

      // wait for db connected
      this._db = await this._mongo.waitForDb()

      // get reference to collection as per the db engine
      this._collectionName = this._name.split(':')[1]
      this._rawCollection = this._db.collection(this._collectionName)

      this._api = utils.getMethods(this._rawCollection)

      // updates here HTTP calls since no indication in source code comments
      for (let m of this._api) {
        if (m.toLowerCase().match(/find/)) {
          if (this._httpMethods.get.indexOf(m) === -1) {
            this._httpMethods.get.push(m)
          }
        } else if (m.toLowerCase().match(/insert/)) {
          if (this._httpMethods.put.indexOf(m) === -1) {
            this._httpMethods.put.push(m)
          }
        } else if (m.toLowerCase().match(/remove/)) {
          if (this._httpMethods.delete.indexOf(m) === -1) {
            this._httpMethods.delete.push(m)
          }
        } else {
          // all the other are update by default
          if (this._httpMethods.post.indexOf(m) === -1) {
            this._httpMethods.post.push(m)
          }
        }

        this[m] = (...args) => {
          return new Promise((resolve, reject) => {
            // remove userId and granted info
            let meta = args.pop()

            let response = this._rawCollection[m].apply(this._rawCollection, args)

            if (response instanceof Cursor) {
              response.toArray().then(result => {
                resolve(result)
              }).catch(err => reject(err))
            } else {
              response.then(result => {
                if (result.result) {
                  resolve(result.result)
                } else {
                  resolve(result)
                }
              }).catch(err => reject(err))
            }
          })
        }
      }

      await super._init()
      pino.info('initialized datum [' + this._name + ']')
    } catch (err) {
      pino.error(err, 'datum [%s] init failure', this._name)
    }
  }

  /* ------------------------------------------------------------------------
      Common API
     ------------------------------------------------------------------------ */
  /* creates a doc */
  d_create(obj) {
    /* @_PUT_ */
    return new Promise((resolve, reject) => {
      this._rawCollection.insertOne(obj, { w: 1 }).then(response => {
        resolve(response.result)
      }).catch(err => {
        reject(err)
      })
    })
  }

  /* alias to create */
  d_put(obj) {
    /* @_PUT_ */
    return this._rawCollection.insertOne(obj)
  }

  /* get document for query (first match) */
  d_get(query) {
    /* @_GET_ */
    return this._rawCollection.findOne(query)
  }

  /* get documents for query */
  d_find(query) {
    /* @_GET_ */
    return this._rawCollection.find(query).toArray()
  }

  /* updates matching doc (first match) */
  d_update(query, obj) {
    /* @_POST_ */
    return this._rawCollection.updateOne(query, obj)
  }

  /* deletes matching doc (first match) */
  d_delete(query) {
    /* @_DELETE_ */
    return new Promise((resolve, reject) => {
      this._rawCollection.deleteOne(query).then(response => {
        resolve(response.result)
      }).catch(err => {
        reject(err)
      })
    })
  }
}

module.exports = MongoDatum
