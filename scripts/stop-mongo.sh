#!/usr/bin/env bash

source "$(dirname "$BASH_SOURCE[0]")/config.sh"

if [ -z "$1" ]; then
  echo "Using default container name $CONTAINER_NAME"
else
  CONTAINER_NAME=$1
fi

echo "--- Docker output:"

docker stop $CONTAINER_NAME
