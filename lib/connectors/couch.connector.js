const nano = require('nano')

const Service = require('@ignitial/iio-services').Service
const utils = require('@ignitial/iio-services').utils
const getAllMethods = utils.getMethods

const pino = require('../utils').pino

class CouchConnector extends Service {
  constructor(options) {
    super(options)

    this._db = null

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

      if (attempts >= this._options.maxAttempts) {
        clearInterval(connInterval)
        pino.error('error connecting to db')
        process.exit(1)
      }
    }, 1000)
  }

  _dbExists(name) {
    return new Promise((resolve, reject) => {
      let found
      this._client.db.list().then(body => {
        for (let db of body) {
          if (db === name) {
            found = true
            break
          }
        }

        resolve(found)
      }).catch(err => {
        reject(err)
      })
    })
  }

  async _connect(attempts) {
    try {
      let options = this._options.dbConnector.couch
      var uri = options.uri +
        '/' + (options.options ? '?' + options.options : '')

      this._client = await nano(uri)

      let dbExists = await this._dbExists(options.dbName)
      if (!dbExists) {
        await this._client.db.create(options.dbName)
      }

      this._db = await this._client.db.use(options.dbName)
      return true
    } catch (err) {
      pino.warn('Waiting for db... ' + attempts + 's elapsed at ' + uri)
      return false
    }
  }

  _mapMethods() {
    this._api = getAllMethods(this._db)

    for (let m of this._api) {
      this[m] = this._db[m]
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
      }, this._options.maxAttempts * 1000)
    })
  }
}

module.exports = CouchConnector
