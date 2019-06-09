const rolesData = require('../../data/roles')

const utils = require('./utils-couch')

exports.populate = async db => {
  console.log('populating roles...')
  let docs
  try {
    console.log('roles: getting design doc...')
    docs = (await db.view('roles', 'all')).rows
  } catch (err) {
    console.log('roles: failed to get view:', err.error)
    console.log('roles: updating design doc...')
    await db.insert({
      _id: '_design/roles',
      views: {
        all: {
          map: function(doc) {
           if (doc.iio_collection && doc.iio_collection === 'roles') {
             emit(doc._id, doc._rev)
           }
         }
        }
      }
    })

    docs = (await db.view('roles', 'all')).rows
  }

  await utils.prune(db, 'roles', docs)

  rolesData.iio_collection = 'roles'
  await db.insert(rolesData)
  console.log('roles done')
}
