#!/usr/bin/env bash

CONTAINER_NAME="parksys-mongo"

if [ -z "$1" ]
then
  echo "Using default container name $CONTAINER_NAME"
else
  CONTAINER_NAME=$1
fi

echo "--- Docker output:"

docker start $CONTAINER_NAME