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
  d_create(obj) {}

  /* alias to create */
  d_put(obj) {}

  /* get document for query (first match) */
  d_get(query) {}

  /* get documents for query */
  d_find(query) {}

  /* updates matching doc (first match) */
  d_update(query, ) {}

  /* deletes matching doc (first match) */
  d_del(query) {}

  /* attach a schema */
  d_setSchema(schema) {
    return new Promise((resolve, reject) => {
      this._schema = _schema
      resolve()
    })
  }

  /* get attached schema if any */
  d_getSchema() {
    return new Promise((resolve, reject) => {
      if (this._schema) {
        resolve(this._schema)
      } else {
        reject(new Error('schema missing'))
      }
    })
  }
}

module.exports = Datum
