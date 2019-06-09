const rolesData = require('../../data/roles')

exports.populate = async db => {
  let roles = db.collection('roles')

  await roles.deleteMany({}) // reset
  let docs = await roles.find().toArray()
  console.log('roles reset done: ', !docs.length)

  await roles.insertOne(rolesData, { w: 1 })
  console.log('roles done')
}
