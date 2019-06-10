const chalk = require('chalk')
const should = require('should')
const fs = require('fs')
const path = require('path')
const ObjectID = require('mongodb').ObjectID

const Gateway = require('@ignitial/iio-services').Gateway
const config = require('./config')

let userRoles = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../tools/data/randomRoles.json'), 'utf8'))

let admin

for (admin in userRoles) {
  if (userRoles[admin] === 'admin') break
}

console.log('ADMIN', admin)

var okNominalCounter = 0

let gateway = new Gateway(config)
gateway._init().then(() => {
  console.log(chalk.green('gateway initialized ✔'))
  okNominalCounter++

}).catch(err => {
  console.log(chalk.red('gateway initialized ✘'))
  console.log(err)
})

if (!process.env.STREAMING) {
  gateway.on('service:registered', async (serviceName, serviceInfo) => {
    if (serviceName === 'dlake:users') {
      // console.log(serviceInfo.methods)
      try {
        (serviceInfo.methods.indexOf('find') !== -1).should.be.true()
        console.log(chalk.green('datum service find method available ✔'))
      } catch (err) {
        console.log(chalk.red('datum service find method available ✘'))
        console.log(err)
      }

      gateway.api['dlake:users'].find({}, { $userId: admin }).then(docs => {
        var idToSearch = docs[0]._id
        var usernameToCheck = docs[0].login.username
        try {
          (docs.length >= 4900).should.be.true()
          console.log(chalk.green('find 4900 users ✔'))

          gateway.api['dlake:users'].findOne({
            _id: idToSearch
          }, { $userId: admin }).then(doc => {
            try {
              (doc.login.username === usernameToCheck).should.be.true()
              console.log(chalk.green('find by id ✔'))
            } catch (err) {
              console.log(chalk.red('find by id ✘'))
              console.log(doc)
            }
          }).catch(err => console.log(err))
        } catch (err) {
          console.log(chalk.red('find 4900 users ✘'))
          console.log(docs.length)
        }
      }).catch(err => console.log(err))

      gateway.api['dlake:users'].d_find({}, { $userId: admin }).then(docs => {
        var idToSearch = docs[0]._id
        var usernameToCheck = docs[0].login.username
        try {
          (docs.length >= 4900).should.be.true()
          console.log(chalk.green('common API find 4900 users ✔'))

          gateway.api['dlake:users'].d_get({
            _id: idToSearch
          }, { $userId: admin }).then(doc => {
            try {
              (doc.login.username === usernameToCheck).should.be.true()
              console.log(chalk.green('common API get by id ✔'))
            } catch (err) {
              console.log(chalk.red('common API get by id ✘'))
              console.log(doc)
            }
          }).catch(err => console.log(err))
        } catch (err) {
          console.log(chalk.red('common API find 4900 users ✘'))
          console.log(err)
        }
      }).catch(err => console.log(err))

      setTimeout(() => {
        gateway.api['dlake:users'].indexes({ $userId: admin }).then(result => {
          console.log(chalk.green('get indexes for users ✔'))
          try {
            (result.length === 2).should.be.true()
            console.log(chalk.green('available indexes for users ✔'))
          } catch (err) {
            console.log(chalk.red('available indexes for users ✘'))
            console.log(result)
          }

          gateway.api['dlake:users'].d_get({}, { $userId: admin }).then(async doc => {
            delete doc._id

            try {
              await gateway.api['dlake:users'].d_delete({
                'login.username': 'gcrood'
              }, { $userId: admin })

              console.log(chalk.green('delete user with common API ✔'))
            } catch (err) {
              console.log(chalk.red('delete user with common API ✘'))
            }

            gateway.api['dlake:users'].d_create(doc, { $userId: admin }).then(result => {
              console.log(chalk.red('bad unique index for users ✘'))
            }).catch(err => {
              console.log(chalk.green('bad unique index for users ✔'))

              doc.login.username = 'gcrood'
              gateway.api['dlake:users'].d_create(doc, { $userId: admin }).then(async result => {
                console.log(chalk.green('create user with common API ✔'))

                try {
                  await gateway.api['dlake:users'].deleteOne({
                    'login.username': 'tcrood'
                  }, { $userId: admin })

                  console.log(chalk.green('delete user ✔'))
                } catch (err) {
                  console.log(chalk.red('delete user ✘'))
                }

                doc.login.username = 'tcrood'
                gateway.api['dlake:users'].insertOne(doc, { $userId: admin }).then(result => {
                  console.log(chalk.green('create user ✔'))
                }).catch(err => {
                  console.log(chalk.red('create user ✘'))
                  console.log(err)
                })
              }).catch(err => {
                console.log(chalk.red('create user with common API ✘'))
                console.log(err)
              })
            })
          }).catch(err => console.log(err))
        }).catch(err => {
          console.log(chalk.red('get indexes for users ✘'))
          console.log(err)
        })
      }, 1000)

      gateway.api['dlake:users'].indexExists('login.username_1', { $userId: admin }).then(result => {
        console.log(chalk.green('get unique index for users ✔'))
        if (!result) {
          gateway.api['dlake:users'].createIndex({
            'login.username': 1
          }, {
            unique: true
          }, { $userId: admin }).then(result => {
            console.log(chalk.green('create unique index for users ✔'))
          }).catch(err => {
            console.log(chalk.red('create unique index for users ✘'))
            console.log(err)
          })
        } else {
          console.log(chalk.green('created previously unique index for users ✔'))
        }
      }).catch(err => {
        console.log(chalk.red('get unique index for users ✘'))
        console.log(err)
      })
    }

    if (serviceName === 'dlake') {
      gateway.api['dlake'].addDatum('totos', { $userId: admin }).then(() => {
        console.log(chalk.green('add datum ✔'))
      }).catch(err => {
        console.log(chalk.red('add datum ✘'))
        console.log(err)
      })
    }

    if (serviceName === 'dlake:totos') {
      console.log(chalk.green('datum add for totos ✔'))
    }
  })
}
