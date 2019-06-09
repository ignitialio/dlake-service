#!/usr/bin/env node

const nano = require('nano')
const config = require('../config').couch

const users = require('./lib/populate_couch/populate_users.js').populate
const roles = require('./lib/populate_couch/populate_roles.js').populate
const notifications = require('./lib/populate_couch/populate_notifications.js').populate

function _dbExists(client, name) {
  return new Promise((resolve, reject) => {
    let found
    client.db.list().then(body => {
      console.log('list', body)
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

async function run() {
  try {
    let client = await nano(config.uri)
    let dbExists = await _dbExists(client, config.dbName)
    console.log(config.dbName + ' exists: ' + dbExists)
    if (!dbExists) {
      await client.db.create(config.dbName)
      console.log(config.dbName + ' created')
    }

    let db = await client.db.use(config.dbName)
    await roles(db)
    await users(db)
    await notifications(db)
    console.log('populate done')
  } catch (err) {
    console.log('error connecting to db', err)
  }
}

if (require.main === module) {
  run()
}

module.exports = run
