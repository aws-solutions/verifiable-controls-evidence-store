#!/usr/bin/env node
/* 
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';

import { AGSSharedInfraStage } from '../lib/ags-shared-infra-stage';

function validateName(name?: string): boolean {
    return !!name && /^[a-zA-Z0-9\-_]+$/.test(name.trim());
}

const app = new cdk.App();

// get service name
const serviceName = app.node.tryGetContext('serviceName');
if (!validateName(serviceName)) {
    throw new Error(
        'Service name must be specified in context.json. Valid value should match /^[a-zA-Z0-9-_]*$/.'
    );
}

// get shared infra version
const sharedInfraVersion = app.node.tryGetContext('sharedInfraVersion');

// Whether or not it is deploy to personal isengard account
const isPersonal = app.node.tryGetContext('personal') === 'on';

// get configuration path
const configPath = path.resolve(__dirname, app.node.tryGetContext('configurationPath'));

// get command line arguments of account, region and envName
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION;

// default configuration is "Default.json" and default env is Default
let envName = app.node.tryGetContext('envName') || 'Default';
let configName = app.node.tryGetContext('configName') || 'Default';

//handle personal dev deployment
if (isPersonal) {
    configName = 'Personal';
    envName = 'Personal';
}

// read configuration from the file
const configFilePath = path.join(configPath, `${configName}.json`);
if (!fs.existsSync(configFilePath)) {
    throw new Error(`Service configuration file not found. path: [${configFilePath}]`);
}

const configFile = fs.readFileSync(configFilePath, { encoding: 'utf8' });

// configuration is the data in the key named by the service name
const configuration = JSON.parse(configFile)[serviceName];

// read solution containing solution id and version file
const solutionInfoFilePath = app.node.tryGetContext('solutionInfoFilePath');
let solutionInfo: Record<string, string> | undefined = undefined;

if (solutionInfoFilePath) {
    const solutionInfoFile = path.resolve(__dirname, solutionInfoFilePath);
    if (fs.existsSync(solutionInfoFile)) {
        solutionInfo = JSON.parse(
            fs.readFileSync(solutionInfoFile, { encoding: 'utf8' })
        );
    }
}

// synth stages based on input
new AGSSharedInfraStage(app, `${envName}Stage`, {
    env: {
        account,
        region,
    },
    serviceName,
    envName,
    configName,
    configuration,
    sharedInfraVersion,
    solutionInfo,
});

// dummy stack to remove the error for no stack after synth
new cdk.Stack(app, 'NonOp');
