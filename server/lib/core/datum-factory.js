const fs = require('fs')
const path = require('path')

const pino = require('../utils').pino

class DatumFactory {
  constructor() {
    this._datumClasses = {}

    let baseFolder = path.join(__dirname, './db-datum')
    let datumSrcs = fs.readdirSync(baseFolder)

    try {
      for (let cs of datumSrcs) {
        if (cs.match(/-datum\.js/)) {
          let Klass = require(path.join(baseFolder, cs))
          this.registerDatumClass(cs.replace('-datum.js', ''), Klass)
        }
      }
    } catch (err) {
      pino.error(err, 'failed to register datums. exiting...')
      console.log(err)
      process.exit(1)
    }
  }

  registerDatumClass(name, Klass) {
    this._datumClasses[name] = Klass
    pino.info('registered class named [%s]', name)
  }

  getDatumClass(name) {
    if (this._datumClasses[name]) {
      return this._datumClasses[name]
    } else {
      throw new Error('datum [' + name + '] missing')
    }
  }

  getDatumInstance(name, options) {
    pino.info('instantiating class named [%s] with options [%s]', name,
      JSON.stringify(options, null, 2))
    if (this._datumClasses[name]) {
      let instance = new this._datumClasses[name](options)
      return instance
    } else {
      throw new Error('datum [' + name + '] missing')
    }
  }

  list() {
    return Object.keys(this._datumClasses)
  }
}

module.exports = DatumFactory
