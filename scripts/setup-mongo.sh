#!/usr/bin/env bash

CONTAINER_NAME="parksys-mongo"
CONTAINER_PORT_MAP="27017:27017"

if [ -z "$1" ]
then
  echo "Using default container name $CONTAINER_NAME"
else
  CONTAINER_NAME=$1
fi

if [ -z "$2" ]
then
  echo "Using default port map $CONTAINER_PORT_MAP"
else
  CONTAINER_PORT_MAP=$2
fi

echo "--- Docker output:"

docker pull mongo
docker create --name $CONTAINER_NAME -p $CONTAINER_PORT_MAP mongo
