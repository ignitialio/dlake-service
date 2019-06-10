const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const _ = require('lodash')
const got = require('got')

let salt = bcrypt.genSaltSync(10)
let hash = bcrypt.hashSync('toto13!', salt)

/*
{
  "gender": "male",
  "name": {
    "title": "mr",
    "first": "rolf",
    "last": "hegdal"
  },
  "location": {
    "street": "ljan terrasse 346",
    "city": "vear",
    "state": "rogaland",
    "postcode": "3095",
    "coordinates": {
      "latitude": "54.8646",
      "longitude": "-97.3136"
    },
    "timezone": {
      "offset": "-10:00",
      "description": "Hawaii"
    }
  },
  "email": "rolf.hegdal@example.com",
  "login": {
    "uuid": "c4168eac-84b8-46ea-b735-c9da9bfb97fd",
    "username": "bluefrog786",
    "password": "ingrid",
    "salt": "GtRFz4NE",
    "md5": "5c581c5748fc8c35bd7f16eac9efbb55",
    "sha1": "c3feb8887abed9ec1561b9aa2c9f58de21d1d3d9",
    "sha256": "684c478a98b43f1ef1703b35b8bbf61b27dbc93d52acd515e141e97e04447712"
  },
  "dob": {
    "date": "1975-11-12T06:34:44Z",
    "age": 42
  },
  "registered": {
    "date": "2015-11-04T22:09:36Z",
    "age": 2
  },
  "phone": "66976498",
  "cell": "40652479",
  "id": {
    "name": "FN",
    "value": "12117533881"
  },
  "picture": {
    "large": "https://randomuser.me/api/portraits/men/65.jpg",
    "medium": "https://randomuser.me/api/portraits/med/men/65.jpg",
    "thumbnail": "https://randomuser.me/api/portraits/thumb/men/65.jpg"
  },
  "nat": "NO"
}
*/
exports.populate = async db => {
  try {
    let users = db.collection('users')

    await users.deleteMany({}) // reset

    let response = await got({
      url: 'https://randomuser.me/api?results=5000',
      json: true
    })

    let usersData = response.body.results

    console.log('users data length before rework', usersData.length)
    usersData = _.uniqBy(usersData, 'login.username')
    usersData.splice(4900)

    console.log('users data length', usersData.length)
    let userRoles = {}
    for (let i = 0; i < usersData.length; i++) {
      let user = usersData[i]
      user.login.password = hash
      if (i  % 1000 === 0) {
        userRoles[user.login.username] = 'admin'
        console.log('WARNING: this is an admin: ', user.login.username)
      } else {
        userRoles[user.login.username] = 'user'
      }

      await users.insertOne(user)
    }

    let docs = await users.find().toArray()

    console.log('users collection length ', docs.length)
    console.log('users done')
    fs.writeFileSync(path.join(__dirname, '../../data/randomRoles.json'),
      JSON.stringify(userRoles, null, 2), 'utf8')
    return userRoles
  } catch (err) {
    console.log(err)
  }
}
