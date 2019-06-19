const Service = require('@ignitial/iio-services').Service

class Datum extends Service {
  constructor(options) {
    super(options)

    // eventually has a schema
    this._schema = null

    // makes it abstract
    if (new.target === Datum) {
      throw new TypeError('cannot construct Datum instances directly')
    }
  }

  /* ------------------------------------------------------------------------
      Common to any db connector
     ------------------------------------------------------------------------ */
  /* creates a doc */
  dCreate(obj) {}

  /* alias to create */
  dPut(obj) {}

  /* get document for query (first match) */
  dGet(query) {}

  /* get documents for query */
  dFind(query) {}

  /* updates matching doc (first match) */
  dUpdate(query) {}

  /* deletes matching doc (first match) */
  gDel(query) {}

  /* attach a schema */
  dSet(schema) {
    // @_POST_
    return new Promise((resolve, reject) => {
      this._schema = schema
      resolve()
    })
  }

  /* get attached schema if any */
  dGetSchema() {
    // @_GET_
    return new Promise((resolve, reject) => {
      if (this._schema) {
        resolve(this._schema)
      } else {
        reject(new Error('schema missing'))
      }
    })
  }

  /* returns idName, means the name of the property used as primary id */
  idName() {
    // @_GET_
    return new Promise((resolve, reject) => {
      resolve(this._options.idName)
    })
  }
}

module.exports = Datum
