#!/bin/sh

docker-compose -f docker-compose-couch.yml up -d
sleep 2
node test/if-test-couch.js

docker-compose -f docker-compose-couch.yml stop
docker-compose -f docker-compose-couch.yml rm -f
