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

describe('Sdk client tests', () => {
    // save a local copy of process environment variables
    const processEnv = process.env;

    afterAll(() => {
        // restore process environment variables
        process.env = { ...processEnv };
    });

    test('can return sdk client config', () => {
        process.env.SOLUTION_ID = 'AWS_TEST/SOLUTION_XXX';
        process.env.SOLUTION_VERSION = 'v0.0.1';

        const sdkClient = require('src/common/SdkClient');
        expect(sdkClient.baseSdkClientConfig).toMatchObject({
            customUserAgent: [['AWS_TEST/SOLUTION_XXX', 'v0.0.1']],
        });
    });
});
