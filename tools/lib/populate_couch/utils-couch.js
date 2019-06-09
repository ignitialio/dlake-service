exports.prune = async function(db, collection, docs) {
  let currentTotal = docs.length

  if (currentTotal > 0) {
    console.log(collection + ': ' + currentTotal)
    docs = (await db.view(collection, 'all')).rows
    if (currentTotal > 0) {
      for (let doc of docs) {
        try {
          await db.destroy(doc.id, doc.value)
        } catch (err) {
          console.log(err.toString(), doc)
        }
      }

      docs = (await db.view(collection, 'all')).rows
      console.log(collection + ' reset done: ', !docs.length)
    }
  } else {
    console.log('nothing to prune for ' + collection)
  }
}
