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

const NODE_ENV_DEV = 'development';

const getDevCredentials = () => {
    if (
        process.env.NODE_ENV === NODE_ENV_DEV &&
        process.env.REACT_APP_AWS_ACCESS_KEY_ID &&
        process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
    ) {
        return {
            accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.REACT_APP_AWS_SESSION_TOKEN,
        };
    }

    return {
        accessKeyId: '',
        secretAccessKey: '',
        sessionToken: '',
    };
};

export const isDevEnv = process.env.NODE_ENV === NODE_ENV_DEV;
export const devCredentials = getDevCredentials();
export const devRegion = 'ap-southeast-2';
export const devUserName = 'DevUser';
export const devUserGroups = [
    'ChiefRiskOffice',
    'DomainOwner',
    'Line1Risk',
    'SystemAdmin',
];
