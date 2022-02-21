#!/bin/bash

set -e

APP=${1:-app}
SCRIPT_FOLDER=$(dirname $0)

echo "Building static website asset for App ${APP}"
GENERATE_SOURCEMAP=false BUILD_PATH=${SCRIPT_FOLDER}/../build/${APP}/Prod craco build
