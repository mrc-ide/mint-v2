#!/usr/bin/env bash
set -ex

HERE=$(realpath "$(dirname $0)")

. $HERE/common.sh

docker network create $NETWORK > /dev/null || /bin/true

docker run -d --rm --name $NAME_REDIS --network=$NETWORK -p 6379:6379 redis:8.0

MINTR_IMAGE=$REGISTRY/$ORG/$API:$API_REF
docker run --rm -d \
  --pull always \
  --network=$NETWORK \
  --name=$API \
  -p 8888:8888 $MINTR_IMAGE 