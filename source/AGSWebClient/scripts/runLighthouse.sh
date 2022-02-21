#!/bin/bash

set -e

# Run Lighthouse 
# Usage: 
# Option 1: Run against the local web server using build assets:
# ./scripts/runLighthouse.sh build [--debug]
# Option 2: Run against Dev/Preprod/Prod environment
# ./scripts/runLighthouse.sh <url> [--debug]

BASE_URL=${1:-build}
echo BASE_URL=${BASE_URL}

BUILD_ASSETS_PATH=$(pwd)/build/app/Preprod
PORT=7070
LOCAL_WEB_SERVER_URL=http://localhost:${PORT}

REPORT_FOLDER=$(pwd)/reports/lighthouse

echo "Cleanning existing lighthouse report folder ${REPORT_FOLDER}"

if [ -d $REPORT_FOLDER ]; then rm -rf $REPORT_FOLDER; fi
mkdir -p ${REPORT_FOLDER}

PID=-1
RETRY_COUNT=0
MAX_RETRY_COUNT=60

function waitForWebServeReady {
    echo "Waiting for web server ready"
    HTTP_CODE=`curl -I "${LOCAL_WEB_SERVER_URL}" 2>&1 | awk '/HTTP\// {print $2}'`
    if [ "$HTTP_CODE" != "200" ]
    then 
        checkRetry
    else    
        echo "Web Server is ready"
    fi
}

function killWebServer {
    if [ $PID -ne -1 ]; then
        echo "Killing web server at PID=${PID}"
        kill -9 ${PID}
    fi 
}

function checkRetry {
    if [ $RETRY_COUNT -lt $MAX_RETRY_COUNT ]; 
    then
        echo "Web server return ${HTTP_CODE}"
        RETRY_COUNT=$((${RETRY_COUNT}+1))
        sleep 2
        echo "Retry ${RETRY_COUNT} ..."
        waitForWebServeReady
    else 
        echo "Maxmum retry ${MAX_RETRY_COUNT} reach"
        echo "Web Server may be failed to start"
        exit 1
    fi
}

trap "killWebServer" ERR

if [ "$BASE_URL" = 'build' ]; then
    echo "Starting web server using build assets at ${BUILD_ASSETS_PATH}"
    npx serve -s ${BUILD_ASSETS_PATH} -l ${PORT} --no-port-switching &
    PID=$!
    echo "Web server is running at PID=${PID}"
    BASE_URL=${LOCAL_WEB_SERVER_URL}

    waitForWebServeReady
fi 

node ./lighthouse/src/index.js ${@:2} -u ${BASE_URL} -k ${AWS_ACCESS_KEY_ID} -s ${AWS_SECRET_ACCESS_KEY} -t ${AWS_SESSION_TOKEN}

killWebServer



