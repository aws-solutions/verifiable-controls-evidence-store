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

const AWS = require('aws-sdk');
const ssmClient = new AWS.SSM({ apiVersion: '2014-11-06' });
const cdkFile = require('../cdk.json');

const getCurrentSharedInfraVersion = () => {
    return cdkFile.context.sharedInfraVersion;
};

const getDeployedShareInfraVersion = () => {
    return new Promise((resolve) => {
        ssmClient
            .getParameter({
                Name: '/ags/sharedInfraVersion',
            })
            .promise()
            .then((data) => {
                if (data) {
                    resolve(data.Parameter.Value);
                } else {
                    resolve('ERROR');
                }
            })
            .catch((error) => {
                if (error.code === 'ParameterNotFound') {
                    resolve('NOT_DEPLOYED');
                } else {
                    console.log(
                        `Failed to retrieve AGS Shared Infra version from target environment. Error: ${error}`
                    );
                    resolve('ERROR');
                }
            });
    });
};

module.exports = {
    getDeployedShareInfraVersion,
    getCurrentSharedInfraVersion,
};
