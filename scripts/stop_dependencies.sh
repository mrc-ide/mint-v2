#!/usr/bin/env bash
set -ex

HERE=$(realpath "$(dirname $0)")

. $HERE/common.sh

docker stop $NAME_REDIS $NAME_API