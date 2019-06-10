#!/usr/bin/env node

const MongoClient = require('mongodb').MongoClient
const config = require('../config').dbConnector.mongo

const users = require('./lib/populate-mongo/populate_users.js').populate
const roles = require('./lib/populate-roles.js').populate

async function run() {
  try {
    let client = await MongoClient.connect(config.uri + '/' + config.dbName,
      { useNewUrlParser: true })

    console.log('start populating ' + config.uri + '/' + config.dbName)
    let db = client.db()
    let userRoles = await users(db)
    await roles(userRoles)
    console.log('populate done')
    client.close()
  } catch (err) {
    console.log('error connecting to db', err)
  }
}

if (require.main === module) {
  run()
}

module.exports = run
