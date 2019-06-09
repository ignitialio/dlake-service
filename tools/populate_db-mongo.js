#!/usr/bin/env node

const MongoClient = require('mongodb').MongoClient
const config = require('../config').mongo

const users = require('./lib/populate/populate_users.js').populate
const roles = require('./lib/populate/populate_roles.js').populate
const notifications = require('./lib/populate/populate_notifications.js').populate

async function run() {
  try {
    let client = await MongoClient.connect(config.uri + '/' + config.dbName,
      { useNewUrlParser: true })

    console.log('start populating ' + config.uri + '/' + config.dbName)
    let db = client.db()
    await roles(db)
    await users(db)
    await notifications(db)
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
