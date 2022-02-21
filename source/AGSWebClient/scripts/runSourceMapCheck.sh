#!/bin/bash

set -e

BUILD_ASSETS_PATH=$(pwd)/build/app/Preprod
REPORT_FOLDER=$(pwd)/reports/source-map
REPORT_PATH_JSON=${REPORT_FOLDER}/report.json
REPORT_PATH_HTML=${REPORT_FOLDER}/report.html
BUNDLE_SIZE_THRESHOLD=5000000

if [ -d $REPORT_FOLDER ]; then rm -rf $REPORT_FOLDER; fi 
mkdir -p ${REPORT_FOLDER}

echo "Creating source map in json format"
npx source-map-explorer ${BUILD_ASSETS_PATH}/static/js/*.js --json ${REPORT_PATH_JSON}

echo "Creating source map in html format"
npx source-map-explorer ${BUILD_ASSETS_PATH}/static/js/*.js --html ${REPORT_PATH_HTML}

echo "File bundle size:"
cat ${REPORT_PATH_JSON} | jq ".results[] | .bundleName,.totalBytes" 

FAILED_FILE_COUNT=$(cat ${REPORT_PATH_JSON} | jq ".results[] | select(.totalBytes>${BUNDLE_SIZE_THRESHOLD}) | .bundleName" -r | wc -l | awk '{$1=$1;print}')

echo "FAILED_FILE_COUNT=${FAILED_FILE_COUNT}"

if [ ${FAILED_FILE_COUNT} -gt 0 ] ; then
    echo "FAILED: One or more file bundle size exceeds threshold ${BUNDLE_SIZE_THRESHOLD}"
    exit 1
else
    echo "PASS: All file bundle size are below threshold ${BUNDLE_SIZE_THRESHOLD}"
fi
