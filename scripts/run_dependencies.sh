#!/usr/bin/env bash
set -ex

HERE=$(realpath "$(dirname $0)")

. $HERE/common.sh

docker network create $NETWORK > /dev/null || /bin/true

docker run -d --rm --name $NAME_REDIS --network=$NETWORK -p 6379:6379 redis:5.0

MINTR_IMAGE=$ORG/$API:$API_VERSION

docker pull $MINTR_IMAGE
docker run --rm -d \
  --network=$NETWORK \
  --name=$API \
  -p 8888:8888 $MINTR_IMAGE 