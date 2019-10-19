#!/bin/sh

docker-compose -f tools/docker/docker-compose-couch.yml up -d couch
sleep 1
node tools/populate_db-couch.js

docker-compose stop
docker-compose rm -f
