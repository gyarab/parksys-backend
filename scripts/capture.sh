#!/usr/sbin/bash

source "$(dirname "$BASH_SOURCE[0]")/config.sh"

if [ "$#" -ne 2 ]; then
    echo "Access token and image path is required!"
    exit 2
fi

ACCESS_TOKEN=$1
IMAGE=$2

if [ "$IMAGE" -f ]; then
    echo "Second arg must be a jpg image!"
    exit 2
fi

NOW=$((`date +"%s"` * 1000))

curl "$HOST/capture" \
    -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -F "capture_$NOW.jpg=@$IMAGE" \
    -v
