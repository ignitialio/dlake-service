const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const _ = require('lodash')

const utils = require('./utils-couch')

let salt = bcrypt.genSaltSync(10)
let hash = bcrypt.hashSync('toto13!', salt)

let additionalUsers = require('../../data/users')

let template = {
  "username": "gcrood",
  "firstname": "Grug",
  "lastname": "Crood",
  "password": hash,
  "avatar": '',
  "role": 'admin',
  "contactInfo": {
    "email": "contact@ignitial.fr",
    "phone": {
      "mobile": "06 66 66 66 66",
      "office": "06 66 66 66 66"
    }
  },
  "settings": {
    "notificationsByEmail": false
  }
}

exports.populate = async db => {
  console.log('populating users...')
  let docs
  try {
    console.log('roles: getting design doc...')
    docs = (await db.view('users', 'all')).rows
  } catch (err) {
    console.log('users: failed to get view:', err.error)
    console.log('users: updating design doc...')
    await db.insert({
      _id: '_design/users',
      views: {
        all: {
          map: function(doc) {
           if (doc.iio_collection && doc.iio_collection === 'users') {
             emit(doc._id, doc._rev)
           }
         }
        }
      }
    })

    docs = (await db.view('users', 'all')).rows
  }

  await utils.prune(db, 'users', docs)

  // insert admin
  let admin = _.cloneDeep(template)
  admin.iio_collection = 'users'
  await db.insert(admin)

  for (let user of additionalUsers) {
    user.iio_collection = 'users'
    await db.insert(_.cloneDeep(user))
  }

  if (process.env.STRESS_TEST) {
    let firstnames = JSON.parse(fs.readFileSync(path.join(process.cwd(),
      'tools/data/prenoms.json'), 'utf8'))
    let secondnames = JSON.parse(fs.readFileSync(path.join(process.cwd(),
      'tools/data/patronymes.json'), 'utf8'))

    for (let i = 0; i < 1000; i++) {
      try {
        let obj = _.cloneDeep(template)

        let rawFirstname = firstnames[Math.floor(Math.random()*firstnames.length)]
        obj.firstname = rawFirstname.fields.prenoms

        let secondname = secondnames[Math.floor(Math.random()*secondnames.length)]

        obj.lastname = secondname.slice(0, 1) + secondname.slice(1).toLowerCase().replace(' - ', '-')
        obj.username = obj.firstname.slice(0, 1).toLowerCase()
          + _.camelCase(secondname).toLowerCase()

        obj.contactInfo.email = obj.username + '@igitial.fr'
        obj.contactInfo.phone.mobile = '+33 (0)6 12 34 56 78'
        obj.contactInfo.phone.office = '+33 (0)1 12 34 56 78'

        let gender = rawFirstname.fields.sexe === 'F' ? 'women' : 'men'
        obj.avatar = 'https://randomuser.me/api/portraits/med/' + gender + '/'
          + Math.floor(Math.random()*100)+ '.jpg'

        user.iio_collection = 'users'
        let rec = await db.insert(obj)
      } catch (err) {
        // do nothing since checked
        console.log(err)
        process.exit(1);
      }
    }
  }

  console.log('users done')
}
