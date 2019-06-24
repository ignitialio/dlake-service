const fs = require('fs')

// REDIS configuration
// -----------------------------------------------------------------------------
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379
const REDIS_DB = process.env.REDIS_DB || 0
let REDIS_SENTINELS

if (process.env.REDIS_SENTINELS) {
  REDIS_SENTINELS = []
  let sentinels = process.env.REDIS_SENTINELS.split(',')
  for (let s of sentinels) {
    REDIS_SENTINELS.push({ host: s.split(':')[0], port: s.split(':')[1] })
  }
}

// Authentication secrets
const AUTH_SECRET = process.env.AUTH_SECRET || 'Once upon the time, for ever'

// Main configuration structure
// -----------------------------------------------------------------------------
module.exports = {
  /* name */
  name: process.env.DLAKE_NAME || 'dlake',
  /* service namesapce */
  namespace: process.env.IIOS_NAMESPACE || 'iios',
  /* heartbeat */
  heartbeatPeriod: 5000,
  /* redis server connection */
  connector: {
    redis: {
      /* encoder to be used for packing/unpacking raw messages */
      encoder: process.env.ENCODER || 'bson',
      master: process.env.REDIS_MASTER_NAME,
      sentinels: REDIS_SENTINELS,
      host: REDIS_HOST,
      port: REDIS_PORT,
      db: REDIS_DB
    }
  },
  /* db connectors */
  dbConnector: {
    /* mongodb */
    mongo: {
      uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:40000',
      dbName: process.env.MONGODB_DBNAME || 'ignitialio',
      options: process.env.MONGODB_OPTIONS,
      maxAttempts: process.env.MONGODB_CONN_MAX_ATTEMPTS || 30,
      user: process.env.MONGODB_USER,
      password: process.env.MONGODB_PASSWORD
    }/* ,
    couch: {
      uri: process.env.COUCHDB_URI || 'http://127.0.0.1:5984',
      dbName: process.env.COUCHDB_DBNAME || 'ignitialio',
      options: process.env.COUCHDB_OPTIONS,
      maxAttempts: process.env.COUCHDB_CONN_MAX_ATTEMPTS || 30
    } */
  },
  /* access control: if present, acces control enabled */
  accesscontrol: {
    /* access control namespace */
    namespace: process.env.IIOS_NAMESPACE || 'iios',
    /* connector configuration: optional, default same as global connector, but
       on DB 1 */
    connector: {
      /* redis server connection */
      redis: {
        host: process.env.REDIS_HOST,
        port: 6379,
        db: 1,
        ipFamily: 4
      }
    }
  },
  /* collections: uses plural */
  data: [{
    name: 'users',
    options: {
      idName: 'login.username'
    }
  }],
  /* HTTP server declaration */
  server: {
    /* server host */
    host: process.env.IIOS_SERVER_HOST || '127.0.0.1',
    /* server port: base for each datum service port = incremented from this */
    port: process.env.IIOS_SERVER_PORT || 24097,
    /* path to statically serve (at least one asset for icons for example) */
    path: process.env.IIOS_SERVER_PATH_TO_SERVE || './dist'
  },
  /* authentication secrets and timeout */
  auth: {
    secret: AUTH_SECRET,
    jwtTimeout: '5h'
  }
}