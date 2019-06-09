const chalk = require('chalk')
const should = require('should')
const fs = require('fs')
const path = require('path')
const ObjectID = require('mongodb').ObjectID

const Gateway = require('@ignitial/iio-services').Gateway
const config = require('./config')

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
  gateway.on('service:registered', (serviceName, serviceInfo) => {
    if (serviceName === 'dlake:user') {
      try {
        (serviceInfo.methods.indexOf('find') !== -1).should.be.true()
        console.log(chalk.green('datum service find method available ✔'))
      } catch (err) {
        console.log(chalk.red('datum service find method available ✘'))
        console.log(err)
      }

      gateway.api['dlake:user'].find({}).then(docs => {
        try {
          (docs.length === 2).should.be.true()
          console.log(chalk.green('find two users ✔'))
        } catch (err) {
          console.log(chalk.red('find two users ✘'))
          console.log(err)
        }
      }).catch(err => console.log(err))

      gateway.api['dlake:user'].find({
        _id: new ObjectID('5cf82ad21248463da44e4e76')
      }).then(docs => {
        try {
          (docs[0].username === 'tcrood').should.be.true()
          console.log(chalk.green('find by id ✔'))
        } catch (err) {
          console.log(chalk.red('find by id ✘'))
          console.log(err)
        }
      }).catch(err => console.log(err))
    }
  })
}
