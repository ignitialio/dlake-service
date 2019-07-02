#!/bin/sh

docker-compose -f docker-compose-mongo.yml up -d mongo-dlake redis
sleep 1

export MONGODB_DBNAME=dlaketests
export IIOS_NAMESPACE=dlaketests
node tools/populate_db-mongo.js

docker-compose stop
docker-compose -f docker-compose-mongo.yml rm -f
