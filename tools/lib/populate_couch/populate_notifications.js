const fs = require('fs')
const _ = require('lodash')

const utils = require('./utils-couch')

let status = [
  "noack",
  "ack"
]

let levels = [
  "spam",
  "info",
  "warn",
  "alert",
  "critical"
]

let template = {
  "message": "Changement d'équipe au centre d'information passagers",
  "user": "gcrood",
  "link": "",
  "level": "info",
  "status": "noack",
  "image": "assets/"
}


exports.populate = async db => {
  console.log('populating notifications...')
  let docs
  try {
    console.log('notifications: getting design doc...')
    docs = (await db.view('notifications', 'all')).rows
  } catch (err) {
    console.log('notifications: failed to get view:', err.error)
    console.log('notifications: updating design doc...')
    await db.insert({
      _id: '_design/notifications',
      views: {
        all: {
          map: function(doc) {
           if (doc.iio_collection && doc.iio_collection === 'notifications') {
             emit(doc._id, doc._rev)
           }
         }
        }
      }
    })

    docs = (await db.view('notifications', 'all')).rows
  }

  await utils.prune(db, 'notifications', docs)

  let usersList = (await db.view('users', 'all')).rows

  for (let i = 0; i < 5; i++) {
    let obj = _.cloneDeep(template)

    user = usersList[Math.floor(Math.random()*usersList.length)]

    if (user.username !== 'tcrood') {
      obj.user = user.username

      obj.status = status[Math.floor(Math.random()*status.length)]
      obj.level = levels[Math.floor(Math.random()*levels.length)]
      obj.image = 'assets/icons/' + obj.level + '.png'

      obj.iio_collection = 'notifications'
      await db.insert(obj)
    }
  }

  console.log('notifications done')
}
