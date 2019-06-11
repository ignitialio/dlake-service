const pino = require('pino')

exports.pino = pino({
  name: 'dlake-service',
  safe: true,
  level: process.env.LOG_LEVEL || 'warn',
  prettyPrint: { colorize: true }
})

exports.getByPath = function(obj, path) {
  path = path.split('.')

  for (let p of path) {
    let arrIndex = p.match(/(.*?)\[(.*?)\]/)

    if (arrIndex) {
      obj = obj[arrIndex[1]][arrIndex[2]]
    } else if (obj[p] !== undefined) {
      obj = obj[p]
    }
    else return null
  }

  return obj
}

exports.setByPath = function(obj, path, value) {
  path = path.split('.')
  let level = path[0]
  let next = path.slice(1).join('.')
  if (next === '') {
    obj[level] = value
  } else {
    obj[level] = obj[level] || {}
    this.setByPath(obj[level], next, value)
  }
}
