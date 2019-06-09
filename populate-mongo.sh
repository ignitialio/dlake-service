#!/bin/sh

docker-compose -f docker-compose.yml up -d mongo
sleep 1
node tools/populate_db-mongo.js

docker-compose stop
docker-compose rm -f
