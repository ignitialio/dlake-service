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
let nominalUser

for (admin in userRoles) {
  if (userRoles[admin] === 'admin') break
}

for (nominalUser in userRoles) {
  if (userRoles[nominalUser] === 'user') break
}

console.log('ADMIN', admin)
console.log('USER ', nominalUser)

var okNominalCounter = 0

let gateway = new Gateway(config)
gateway._init().then(() => {
  console.log(chalk.green('gateway initialized ✔'))
  okNominalCounter++
}).catch(err => {
  console.log(chalk.red('gateway initialized ✘'))
  console.log(err)
})

if (!process.env.IIOS_STREAMING) {
  gateway.on('service:registered', async (serviceName, serviceInfo) => {
    if (serviceName === 'dlake:users') {
      // console.log(serviceInfo.methods)
      try {
        (serviceInfo.methods.indexOf('find') !== -1).should.be.true()
        console.log(chalk.green('datum service find method available ✔'))
        okNominalCounter++
      } catch (err) {
        console.log(chalk.red('datum service find method available ✘'))
        console.log(err)
      }

      gateway.api['dlake:users'].find({}, { $userId: nominalUser }).then(async docs => {
        try {
          (docs.length >= 4900).should.be.true()
          console.log(chalk.green('find 4900 users by normal user ✔'))
          okNominalCounter++

          let doc = await gateway.api['dlake:users'].dGet({
            'login.username': nominalUser }, { $userId: nominalUser })
          doc.name.first = 'Grug'

          gateway.api['dlake:users'].dUpdate({ 'login.username': nominalUser },
            doc, { $userId: nominalUser }).then(async result => {
            console.log(chalk.green('update own ✔'))
            okNominalCounter++

            delete doc._id
            doc.login.username = 'toto'

            try {
              // prepare
              await gateway.api['dlake:users'].dDelete({ 'login.username': 'toto' }, { $userId: nominalUser })
              console.log(chalk.green('delete toto ✔'))
              okNominalCounter++
            } catch (err) {
              if (err.toString().match('document not found')) {
                console.log(chalk.green('delete toto ✔'))
                okNominalCounter++
              } else {
                console.log(chalk.red('delete toto ✘'))
                console.log(err)
              }
            }

            gateway.api['dlake:users'].dCreate(doc,
              { $userId: nominalUser }).then(result => {
              console.log(chalk.red('create by nominal user ✘'))
            }).catch(err => {
              console.log(chalk.green('create by nominal user ✔'))
              okNominalCounter++
            })

            try {
              // prepare
              await gateway.api['dlake:users'].dCreate(doc, { $userId: admin })
            } catch (err) {
              console.log(err)
            }

            gateway.api['dlake:users'].dDelete({ 'login.username': 'toto' },
              { $userId: admin }).then(result => {
              console.log(chalk.green('delete own by nominal user ✔'))
              okNominalCounter++
            }).catch(err => {
              console.log(chalk.red('delete own by nominal user  ✘'))
              console.log(err)
            })
          }).catch(err => {
            console.log(chalk.red('update own ✘'))
            console.log(err)
          })
        } catch (err) {
          console.log(chalk.red('find 4900 users by normal user ✘'))
          console.log(err)
        }
      }).catch(err => console.log(err))

      gateway.api['dlake:users'].find({}, { $userId: admin }).then(docs => {
        var idToSearch = docs[0]._id
        var usernameToCheck = docs[0].login.username
        try {
          (docs.length >= 4900).should.be.true()
          console.log(chalk.green('find 4900 users ✔'))
          okNominalCounter++

          gateway.api['dlake:users'].findOne({
            _id: idToSearch
          }, { $userId: admin }).then(doc => {
            try {
              (doc.login.username === usernameToCheck).should.be.true()
              console.log(chalk.green('find by id ✔'))
              okNominalCounter++
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

      gateway.api['dlake:users'].dFind({}, { $userId: admin }).then(docs => {
        var idToSearch = docs[0]._id
        var usernameToCheck = docs[0].login.username
        try {
          (docs.length >= 4900).should.be.true()
          console.log(chalk.green('common API find 4900 users ✔'))
          okNominalCounter++

          gateway.api['dlake:users'].dGet({
            _id: idToSearch
          }, { $userId: admin }).then(doc => {
            try {
              (doc.login.username === usernameToCheck).should.be.true()
              console.log(chalk.green('common API get by id ✔'))
              okNominalCounter++
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

      gateway.api['dlake:users'].dFind({}).then(docs => {
        var idToSearch = docs[0]._id
        var firstnameToCheck = docs[0].name.first
        try {
          (docs.length >= 4900).should.be.true()
          console.log(chalk.green('anonymous common API find 4900 users ✔'))
          okNominalCounter++

          gateway.api['dlake:users'].dGet({
            _id: idToSearch
          }).then(doc => {
            try {
              (doc.name.first === firstnameToCheck).should.be.true()
              console.log(chalk.green('anonymous common API get by id ✔'))
              okNominalCounter++
            } catch (err) {
              console.log(chalk.red('anonymous common API get by id ✘'))
              console.log(doc)
            }
          }).catch(err => console.log(err))
        } catch (err) {
          console.log(chalk.red('anonymous common API find 4900 users ✘'))
          console.log(err)
        }
      }).catch(err => console.log(err))

      setTimeout(() => {
        gateway.api['dlake:users'].indexes({ $userId: admin }).then(result => {
          console.log(chalk.green('get indexes for users ✔'))
          okNominalCounter++
          try {
            (result.length === 2).should.be.true()
            console.log(chalk.green('available indexes for users ✔'))
            okNominalCounter++
          } catch (err) {
            console.log(chalk.red('available indexes for users ✘'))
            console.log(result)
          }

          gateway.api['dlake:users'].dGet({}, { $userId: admin }).then(async doc => {
            delete doc._id

            try {
              await gateway.api['dlake:users'].dDelete({
                'login.username': 'gcrood'
              }, { $userId: admin })

              console.log(chalk.green('delete user with common API ✔'))
              okNominalCounter++
            } catch (err) {
              console.log(chalk.red('delete user with common API ✘'))
            }

            gateway.api['dlake:users'].dCreate(doc, { $userId: admin }).then(result => {
              console.log(chalk.red('bad unique index for users ✘'))
            }).catch(err => {
              console.log(chalk.green('bad unique index for users ✔'))
              okNominalCounter++

              doc.login.username = 'gcrood'
              gateway.api['dlake:users'].dCreate(doc, { $userId: admin }).then(async result => {
                console.log(chalk.green('create user with common API ✔'))
                okNominalCounter++

                try {
                  await gateway.api['dlake:users'].deleteOne({
                    'login.username': 'tcrood'
                  }, { $userId: admin })

                  console.log(chalk.green('delete user ✔'))
                  okNominalCounter++
                } catch (err) {
                  console.log(chalk.red('delete user ✘'))
                }

                doc.login.username = 'tcrood'
                gateway.api['dlake:users'].insertOne(doc, { $userId: admin }).then(result => {
                  console.log(chalk.green('create user ✔'))
                  okNominalCounter++
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

        setTimeout(() => {
          console.log('Total OK', okNominalCounter + '/23')
        }, 3000)
      }, 1000)

      gateway.api['dlake:users'].indexExists('login.username_1', { $userId: admin }).then(result => {
        console.log(chalk.green('get unique index for users ✔'))
        okNominalCounter++
        if (!result) {
          gateway.api['dlake:users'].createIndex({
            'login.username': 1
          }, {
            unique: true
          }, { $userId: admin }).then(result => {
            console.log(chalk.green('create unique index for users ✔'))
            okNominalCounter++
          }).catch(err => {
            console.log(chalk.red('create unique index for users ✘'))
            console.log(err)
          })
        } else {
          console.log(chalk.green('created previously unique index for users ✔'))
          okNominalCounter++
        }
      }).catch(err => {
        console.log(chalk.red('get unique index for users ✘'))
        console.log(err)
      })
    }

    if (serviceName === 'dlake') {
      gateway.api['dlake'].addDatum('totos', { $userId: admin }).then(() => {
        console.log(chalk.green('add datum ✔'))
        okNominalCounter++
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
