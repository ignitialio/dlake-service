let IIOS_REDIS_SENTINELS

if (process.env.IIOS_REDIS_SENTINELS) {
  IIOS_REDIS_SENTINELS = []
  let sentinels = process.env.IIOS_REDIS_SENTINELS.split(',')
  for (let s of sentinels) {
    IIOS_REDIS_SENTINELS.push({ host: s.split(':')[0], port: s.split(':')[1] })
  }
}

module.exports = {
  /* service name */
  name: 'alice',
  /* eventually disables pub/sub calling mechanism in order to use only HTTP */
  pubsubRPC: process.env.IIOS_PUBSUB_RPC,
  /* discovery servers (gateways) when HTTP only */
  discoveryServers: [],
  /* calling timeout for pub/sub mode */
  timeout: 5000,
  /* metrics configuration: no metrics if undefined */
  metrics: {
    /* number of points that triggers metrics push event */
    pushTrigger: 100,
    /* maw number of points to store locally */
    maxPoints: 100
  },
  /* PUB/SUB/KV connector */
  connector: {
    /* redis server connection */
    redis: {
      /* encoder to be used for packing/unpacking raw messages */
      encoder: process.env.IIOS_ENCODER || 'bson',
      host: process.env.IIOS_REDIS_HOST,
      master: process.env.IIOS_REDIS_MASTER_NAME,
      sentinels: IIOS_REDIS_SENTINELS, /* uses redis sentinel if defined */
      port: 6379,
      db: 0,
      ipFamily: 4
    }
  },
  /* service namesapce */
  namespace: process.env.IIOS_NAMESPACE || 'iios',
  /* HTTP server declaration */
  server: {
    /* server host for external call */
    host: process.env.IIOS_SERVER_HOST,
    /* server port */
    port: process.env.IIOS_SERVER_PORT,
    /* indicates that service is behind an HTTPS proxy */
    https: false,
    /* path to statically serve (at least one asset for icons for example) */
    path: './dist'
  },
  /* options published through discovery mechanism */
  publicOptions: {}
}
