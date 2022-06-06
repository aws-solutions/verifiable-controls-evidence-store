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
const { execSync } = require('child_process');

const getWebClientBucket = async () => {
    return new Promise((resolve) => {
        ssmClient
            .getParameter({
                Name: '/ags/webClientBucketS3Url',
            })
            .promise()
            .then((data) => {
                if (data) {
                    if (data.Parameter.Value !== 'dummy-value') {
                        resolve(data.Parameter.Value);
                    } else {
                        resolve('NOT_DEPLOYED');
                    }
                } else {
                    resolve('ERROR');
                }
            })
            .catch((error) => {
                if (error.code === 'ParameterNotFound') {
                    resolve('NOT_DEPLOYED');
                } else {
                    console.log(
                        `Failed t retrieve AGS Shared Infra WebClient URL from target environment. Error: ${error}`
                    );
                    resolve('ERROR');
                }
            });
    });
};

const deployWebClientToS3 = async (webContentDir) => {
    const s3Url = await getWebClientBucket();
    console.log(`Uploading AGS Web Clien to S3 Bucket ${s3Url}`);
    if (s3Url.startsWith('s3://')) {
        try {
            execSync(`aws s3 sync ${webContentDir} ${s3Url}`);

            console.log('Upload AGS Web Client successfully.');
        } catch (err) {
            console.log(`Failed to upload AGS WebClient. Error: ${err}`);
        }
    } else {
        console.log(
            'Cannot find Web Client content bucket. Skip uploading AGS Web Client.'
        );
    }
};

const getCognitoAuthSettings = async () => {
    const sts = new AWS.STS({ apiVersion: '2011-06-15' });
    const callerId = await sts.getCallerIdentity({}).promise();
    const accountId = callerId.Account;
    const results = await ssmClient
        .getParameters({
            Names: [
                '/ags/cognito/clientId',
                '/ags/cognito/domainName',
                '/ags/cognito/identityPoolId',
                '/ags/cognito/userPoolId',
                '/ags/cognito/signInUrl',
                '/ags/cognito/redirectUri',
            ],
        })
        .promise();

    const getValue = (paramName) =>
        results.Parameters.find((item) => item.Name === paramName).Value;

    const data = {
        signInLink: getValue('/ags/cognito/signInUrl'),
        cognitoDomain: getValue('/ags/cognito/domainName'),
        cognitoClientId: getValue('/ags/cognito/clientId'),
        cognitoRedirectUri: getValue('/ags/cognito/redirectUri'),
        cognitoUserPoolId: getValue('/ags/cognito/userPoolId'),
        cognitoIdentityPoolId: getValue('/ags/cognito/identityPoolId'),
        accountId: accountId,
    };
    return data;
};

const createAdminUser = async (userPoolId, userEmail) => {
    const userPool = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
    await userPool
        .adminCreateUser({
            UserPoolId: userPoolId,
            Username: 'admin',
            UserAttributes: [
                {
                    Name: 'email',
                    Value: userEmail,
                },
                {
                    Name: 'email_verified',
                    Value: 'True',
                },
                {
                    Name: 'custom:AGSRoles',
                    Value: 'SystemAdmin',
                },
            ],
            DesiredDeliveryMediums: ['EMAIL'],
        })
        .promise();
};

module.exports = {
    deployWebClientToS3,
    getCognitoAuthSettings,
    createAdminUser,
};
