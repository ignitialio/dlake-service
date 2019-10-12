#!/bin/sh

# export DEBUG=iios:*
export APP_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "app version: ${APP_VERSION}"

export IIOS_DBNAME=dlaketests
export IIOS_NAMESPACE=dlaketests

docker-compose -f docker-compose-mongo.yml up -d mongo-dlake redis-dlake
docker-compose -f docker-compose-mongo.yml up alice dlake > test/logs/test-mongo.log 2>&1 &
sleep 20

docker-compose -f docker-compose-mongo.yml stop alice dlake
docker-compose -f docker-compose-mongo.yml rm -f alice dlake
sleep 1
docker-compose -f docker-compose-mongo.yml stop redis-dlake mongo-dlake
docker-compose -f docker-compose-mongo.yml rm -f redis-dlake mongo-dlake
