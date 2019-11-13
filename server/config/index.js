const fs = require('fs')

// Mongo secrets
var IIOS_MONGODB_PASSWORD = process.env.IIOS_MONGODB_PASSWORD

// get from docker secrets
if (!IIOS_MONGODB_PASSWORD) {
  try {
    IIOS_MONGODB_PASSWORD = fs.readFileSync('/run/secrets/mongodb_pwd', 'utf8').replace('\n', '')
  } catch (err) {
    console.log('warning: failed to get Mongo credentials from file')
  }
}

// REDIS configuration
// -----------------------------------------------------------------------------
const IIOS_REDIS_HOST = process.env.IIOS_REDIS_HOST || '127.0.0.1'
const IIOS_REDIS_PORT = process.env.IIOS_REDIS_PORT ? parseInt(process.env.IIOS_REDIS_PORT) : 6379
const IIOS_REDIS_DB = process.env.IIOS_REDIS_DB || 0
const IIOS_REDIS_ACCESSDB = process.env.IIOS_REDIS_ACCESSDB || 1
let IIOS_REDIS_SENTINELS

if (process.env.IIOS_REDIS_SENTINELS) {
  IIOS_REDIS_SENTINELS = []
  let sentinels = process.env.IIOS_REDIS_SENTINELS.split(',')
  for (let s of sentinels) {
    IIOS_REDIS_SENTINELS.push({ host: s.split(':')[0], port: s.split(':')[1] })
  }
}

// Main configuration structure
// -----------------------------------------------------------------------------
module.exports = {
  /* name */
  name: process.env.DLAKE_NAME || 'dlake',
  /* service namesapce */
  namespace: process.env.IIOS_NAMESPACE || 'iios',
  /* heartbeat */
  heartbeatPeriod: 5000,
  /* populate db by default: default=false */
  populate: process.env.IIOS_POPULATE === 'true' ? true : false,
  /* redis server connection */
  connector: {
    redis: {
      /* encoder to be used for packing/unpacking raw messages */
      encoder: process.env.IIOS_ENCODER || 'bson',
      master: process.env.IIOS_REDIS_MASTER_NAME,
      sentinels: IIOS_REDIS_SENTINELS,
      host: IIOS_REDIS_HOST,
      port: IIOS_REDIS_PORT,
      db: IIOS_REDIS_DB
    }
  },
  /* db connectors */
  dbConnector: {
    /* mongodb */
    mongo: {
      uri: process.env.IIOS_MONGODB_URI || 'mongodb://127.0.0.1:40000',
      dbName: process.env.IIOS_DBNAME || 'ignitialio',
      options: process.env.IIOS_MONGODB_OPTIONS,
      maxAttempts: process.env.IIOS_MONGODB_CONN_MAX_ATTEMPTS || 30,
      user: process.env.IIOS_MONGODB_USER,
      password: IIOS_MONGODB_PASSWORD
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
        encoder: process.env.IIOS_ENCODER || 'bson',
        master: process.env.IIOS_REDIS_MASTER_NAME,
        sentinels: IIOS_REDIS_SENTINELS,
        host: IIOS_REDIS_HOST,
        port: IIOS_REDIS_PORT,
        /* access db is different from discovery */
        db: IIOS_REDIS_ACCESSDB,
        ipFamily: 4
      }
    }
  },
  /* collections: uses plural */
  data: [{
    name: 'users',
    options: {
      idName: 'login.username',
      indexes: [{
        key: 'login.username',
        type: -1,
        options: {
          name: 'name_desc',
          unique: true
        }
      }]
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
  /* options published through discovery mechanism */
  publicOptions: {
    /* declares component injection */
    uiComponentInjection: false,
    /* service description */
    description: {
      /* service icon */
      icon: 'assets/dlake-64.png',
      /* Internationalization: see Ignitial.io Web App */
      i18n: {
        'Data access service': [ 'Service d\'accès aux données' ],
        'Data access for MongoDB, etc. trough IIO access control':  [
          'Accès aux données MongoDB etc. avec contrôle d\'accès IIO'
        ]
      },
      /* eventually any other data */
      title: 'Data access service',
      info: 'Data access for MongoDB, etc. trough IIO access control'
    }
  }
}
