const IIOSAccesControl = require('@ignitial/iio-services/lib/accesscontrol').IIOSAccesControl
const roles = require('../data/roles')
const users = require('../data/users')

exports.populate = async function(setOfUsers) {
  console.log('create IIOS ac instance')
  let ac = new IIOSAccesControl({
    namespace: process.env.IIOS_NAMESPACE || 'iios'
  })

  for (let role in roles) {
    console.log('sets role', role)
    await ac.setGrants(role, roles[role])
  }

  users = setOfUsers || users
  for (let user in users) {
    await ac.setUserRole(user, users[user])
  }

  ac._connector.destroy()
}
