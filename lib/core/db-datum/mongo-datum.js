const Cursor = require('mongodb').Cursor

const Datum = require('../datum')
const utils = require('@ignitial/iio-services').utils

const pino = require('../../utils').pino

class MongoDatum extends Datum {
  constructor(options) {
    super(options)

    this._appendOnly = options.appendOnly
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
      this._collectionName = this._name.split(':')[1] + 's'
      this._rawCollection = this._db.collection(this._collectionName)

      this._api = utils.getMethods(this._rawCollection)

      for (let m of this._api) {
        this[m] = (...args) => {
          return new Promise((resolve, reject) => {
            // remove userId
            args.pop()

            let response = this._rawCollection[m].apply(this._rawCollection, args)

            if (response instanceof Cursor) {
              response.toArray().then(result => {
                resolve(result)
              }).catch(err => reject(err))
            } else {
              response.then(result => {
                resolve(result)
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
}

module.exports = MongoDatum
