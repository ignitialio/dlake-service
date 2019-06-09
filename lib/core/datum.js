const Service = require('@ignitial/iio-services').Service

class Datum extends Service {
  constructor(options) {
    super(options)

    // makes it abstract
    if (new.target === Datum) {
      throw new TypeError('cannot construct Datum instances directly')
    }
  }

  /* searches for matching docs */
  search(args) {}

  /* finds matching doc for id */
  get(args) {}

  /* updates or inserts a doc if id undefined */
  put(args) {}

  /* deletes doc found thanks to driver related query */
  del(args) {}
}

module.exports = Datum
