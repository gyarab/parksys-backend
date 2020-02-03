#!/usr/bin/env bash

source "$(dirname "$BASH_SOURCE[0]")/config.sh"

if [ "$#" -ne 1 ]; then
    echo "Activation password is required as the first argument!"
    exit 2
fi

PASS=$1

JSON=$(curl "$HOST/devices/activate" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"activationPassword\":\"$PASS\"}" \
    2> /dev/null)

echo "$JSON"

