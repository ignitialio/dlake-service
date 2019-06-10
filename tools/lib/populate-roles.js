const IIOSAccesControl = require('@ignitial/iio-services/lib/accesscontrol').IIOSAccesControl
const roles = require('../data/roles')
var users = require('../data/users')

exports.populate = async function(setOfUsers) {
  console.log('create IIOS ac instance')
  let ac = new IIOSAccesControl()

  for (let role in roles) {
    console.log('sets role', role)
    await ac._connector.set('__role:' + role, roles[role])
  }

  users = setOfUsers || users
  for (let user in users) {
    await ac._connector.set('__user:' + user, users[user])
  }

  ac._connector.destroy()
}
