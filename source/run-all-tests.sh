#!/bin/bash
#
# This script runs all tests for the root CDK project, as well as any microservices, Lambda functions, or dependency
# source code packages. These include unit tests, integration tests, and snapshot tests.
#
# This script is called by the ../initialize-repo.sh file and the buildspec.yml file. It is important that this script
# be tested and validated to ensure that all available test fixtures are run.
#
# The if/then blocks are for error handling. They will cause the script to stop executing if an error is thrown from the
# node process running the test case(s). Removing them or not using them for additional calls with result in the
# script continuing to execute despite an error being thrown.

[ "$DEBUG" == 'true' ] && set -x
set -e

prepare_jest_coverage_report() {
	local component_name=$1
    local source_path="${2:-coverage}"

    if [ ! -d "$source_path" ]; then
        echo "ValidationError: Missing required directory coverage after running unit tests"
        exit 129
    fi

	# prepare coverage reports
    rm -fr $source_path/lcov-report
    mkdir -p $coverage_reports_top_path/jest
    coverage_report_path=$coverage_reports_top_path/jest/$component_name
    rm -fr $coverage_report_path
    cp -R $source_path $coverage_report_path
}

run_app_test() {
    echo "------------------------------------------------------------------------------"
    echo "[Test] Run application unit test with coverage"
    echo "------------------------------------------------------------------------------"
    echo "cd AGSEvidenceStore/app/lambda"
	pushd .
    cd AGSEvidenceStore/app/lambda
    # run unit tests
    yarn run test
    # prepare coverage reports
	prepare_jest_coverage_report AGSEvidenceStoreApp
	popd

    echo "cd AGSSecurityHubEvidenceCollector/app/lambda"
	pushd .
    cd AGSSecurityHubEvidenceCollector/app/lambda
    # run unit tests
    yarn run test
    # prepare coverage reports
	prepare_jest_coverage_report AGSSecurityHubEvidenceCollectorApp
	popd


    echo "cd AGSSharedInfra/infra/lambda/securityHeader"
	pushd .
    cd AGSSharedInfra/infra/lambda/securityHeader
    # run unit tests
    yarn run test
    # prepare coverage reports
	popd

    echo "cd AGSSharedInfra/infra/lambda/tokenService"
	pushd .
    cd AGSSharedInfra/infra/lambda/tokenService
    # run unit tests
    yarn run test
    # prepare coverage reports
	prepare_jest_coverage_report AGSSharedInfraTokenService ../coverage/tokenService
	popd

}

run_infra_test() {
	echo "------------------------------------------------------------------------------"
	echo "[Test] infra"
	echo "------------------------------------------------------------------------------"

	# # Option to suppress the Override Warning messages while synthesizing using CDK
	# export overrideWarningsEnabled=false

    echo "cd AGSEvidenceStore/infra"
	pushd .
    cd AGSEvidenceStore/infra
    # run unit tests
    yarn run test
    # prepare coverage reports
	#prepare_jest_coverage_report AGSEvidenceStoreInfra
	popd

    # AGSSecurityHubEvidenceCollector Infra has no tests at the moment
    # echo "cd AGSSecurityHubEvidenceCollector/infra"
	# pushd .
    # cd AGSSecurityHubEvidenceCollector/infra
    # # run unit tests
    # yarn run test
    # # prepare coverage reports
	# prepare_jest_coverage_report AGSSecurityHubEvidenceCollectorInfra
	# popd

    echo "cd AGSSharedInfra/infra"
	pushd .
    cd AGSSharedInfra/infra
    # run unit tests
    yarn run test
    # prepare coverage reports
	# prepare_jest_coverage_report AGSSharedInfraInfra
	popd

}

run_web_test() {
	echo "------------------------------------------------------------------------------"
	echo "[Test] web client"
	echo "------------------------------------------------------------------------------"

    echo "cd AGSWebClient"
	pushd .
    cd AGSWebClient
    # run unit tests
    yarn run test:cover
    # prepare coverage reports
	prepare_jest_coverage_report AGSWebClient
	popd
}

# Run unit tests
echo "Running unit tests"

# Get reference for source folder
source_dir="$(cd $PWD/../source; pwd -P)"
coverage_reports_top_path=$source_dir/coverage-reports

# install 
yarn install --frozen-lockfile

# install in WebClient
cd  AGSWebClient
yarn install --frozen-lockfile
cd ..

# build and test applicaiton lambdas
run_app_test $source_dir

# build and test infra
run_infra_test $source_dir

run_web_test

# Return to the source/ level
cd $source_dir