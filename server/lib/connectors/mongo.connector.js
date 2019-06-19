const MongoClient = require('mongodb').MongoClient

const Service = require('@ignitial/iio-services').Service
const utils = require('@ignitial/iio-services').utils
const getAllMethods = utils.getMethods

const pino = require('../utils').pino

class MongoConnector extends Service {
  constructor(options) {
    super(options)

    this._db = null
    this._options.dbConnector.maxAttempts =
      this._options.dbConnector.maxAttempts || 60

    let attempts = 0

    let connInterval = setInterval(async () => {
      if (await this._connect(attempts)) {
        clearInterval(connInterval)

        this._mapMethods()

        this._init().then(() => {
          this._ready = true
        }).catch(err => {
          pino.error('failed to initialize mongo conenctor service', err)
        })
        return
      }

      attempts++

      if (attempts >= this._options.dbConnector.maxAttempts) {
        clearInterval(connInterval)
        pino.error('error connecting to db')
        process.exit(1)
      }
    }, 1000)
  }

  async _connect(attempts) {
    try {
      var uri
      let options = this._options.dbConnector.mongo

      if (options.user) {
        uri = 'mongodb+srv://' + options.user + ':' +
          options.password + '@' + options.uri +
          '/' + options.dbName +
          (options.options ? '?' + options.options : '')
      } else {
        uri = options.uri +
          '/' + options.dbName +
          (options.options ? '?' + options.options : '')
      }

      this._client = await MongoClient.connect(uri, { useNewUrlParser: true })

      this._db = this._client.db()

      return true
    } catch (err) {
      pino.warn('waiting for db... ' + attempts + 's elapsed at ' + uri)
      console.log(err)
      return false
    }
  }

  _mapMethods() {
    this._api = getAllMethods(this._db)

    for (let m of this._api) {
      this[m] = () => {
        let args = Array.from(arguments)
        // remove userId
        args = args.shift()
        return this._db[m].apply(this._db[m], args)
      }
    }
  }

  get db() {
    return this._db
  }

  waitForDb() {
    return new Promise((resolve, reject) => {
      let checkTimeout

      let checkInterval = setInterval(() => {
        if (this._db) {
          clearInterval(checkInterval)
          clearTimeout(checkTimeout) // nothing if undefined

          resolve(this._db)
        }
      }, 100)

      checkTimeout = setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval)
          reject(new Error('timeout: db is not available'))
        }
      }, this._options.dbConnector.maxAttempts * 1000)
    })
  }
}

module.exports = MongoConnector
