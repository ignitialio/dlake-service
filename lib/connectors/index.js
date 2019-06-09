const MongoConnector = require('./mongo.connector')
const CouchConnector = require('./couch.connector')

module.exports = {
  mongo: MongoConnector,
  couch: CouchConnector
}
