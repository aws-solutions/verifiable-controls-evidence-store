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
const path = require('path');

module.exports = {
    extends: ['react-app', 'react-app/jest'],
    plugins: ['header'],
    root: true,
    rules: {
        'header/header': [2, path.join(__dirname, 'LicenseHeader.txt')],
        'no-restricted-imports': [
            'error',
            {
                paths: ['@material-ui/core', 'aws-northstar'],
                patterns: [
                    '@material-ui/*/*/*',
                    'aws-northstar/*/*/*',
                    '!@material-ui/core/test-utils/*',
                ],
            },
        ],
    },
    overrides: [
        {
            files: ['app/src/config/aws.ts'],
            rules: {
                'header/header': 'off',
            },
        },
        {
            files: ['__mocks__/*.ts'],
            rules: {
                'import/no-anonymous-default-export': 'off',
            },
        },
    ],
};
