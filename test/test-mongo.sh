#!/bin/sh

# export DEBUG=iios:*
export APP_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "app version: ${APP_VERSION}"

export MONGODB_DBNAME=dlaketests
export IIOS_NAMESPACE=dlaketests

docker-compose -f docker-compose-mongo.yml up -d mongo redis
docker-compose -f docker-compose-mongo.yml up alice dlake > test/logs/test-mongo.log 2>&1 &
sleep 20

docker-compose -f docker-compose-mongo.yml stop alice dlake
docker-compose -f docker-compose-mongo.yml rm -f alice dlake
sleep 1
docker-compose -f docker-compose-mongo.yml stop redis mongo
docker-compose -f docker-compose-mongo.yml rm -f redis mongo
