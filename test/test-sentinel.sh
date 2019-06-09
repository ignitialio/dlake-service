#!/bin/sh

#export DEBUG=ioredis:*
#export REDIS_MASTER_NAME=sentinel7000
#export REDIS_SENTINELS='[{ "host": "192.168.1.114", "port": 5000 }, { "host": "192.168.1.114", "port": 5001 },  { "host": "192.168.1.114", "port": 5002 }]'
export REDIS_CLUSTER_IP=0.0.0.0
export REDIS_USE_SENTINEL=true
docker-compose -f docker-compose-sentinel.yml up -d
#sleep 2
#node test/if-test-mongo.js

#docker-compose stop
#docker-compose rm -f
