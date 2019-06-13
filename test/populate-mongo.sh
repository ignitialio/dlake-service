#!/bin/sh

docker-compose -f docker-compose-mongo.yml up -d mongo redis
sleep 1
export MONGODB_DBNAME=dlaketests
node tools/populate_db-mongo.js

docker-compose stop
docker-compose -f docker-compose-mongo.yml rm -f
