#!/bin/bash

set -e

BUILD_FOLDER=$(pwd)/build
if [ -d $BUILD_FOLDER ]; then rm -rf $BUILD_FOLDER; fi 

echo 'Running lint check across all projects'
yarn lint

echo 'Running unit tests with coverage across all projects'
yarn test:cover

echo 'Building assets across all projects'
yarn build

# echo 'Checking Bundle size for app'
# bash ./scripts/runSourceMapCheck.sh
