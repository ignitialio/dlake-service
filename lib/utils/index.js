const pino = require('pino')

exports.pino = pino({
  name: 'dlake-service',
  safe: true,
  level: process.env.LOG_LEVEL || 'warn',
  prettyPrint: { colorize: true }
})
