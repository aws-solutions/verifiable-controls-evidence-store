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

import { EvidenceProducer } from 'src/EvidenceProducer';
import { SecretsManagerClient } from 'src/clients/SecretManagerClient';
import { SSMParameterClient } from 'src/clients/SSMParameterClient';
import { httpPostFn } from 'test/__mocks__/@apjsb-serverless-lib/apjsb-aws-httpclient';
import { getSecretsResponse } from 'test/__mocks__/@aws-sdk/client-secrets-manager';
import { getParameterResponse } from 'test/__mocks__/@aws-sdk/client-ssm';

describe('test evidence producer', () => {
    const testProcessor = new EvidenceProducer();
    beforeEach(() => {
        getParameterResponse.mockClear();
        getSecretsResponse.mockClear();
        httpPostFn.mockClear();
        // @ts-ignore
        SecretsManagerClient._instance = undefined;
        // @ts-ignore
        SSMParameterClient._instance = undefined;
    });

    test('evidence setup with api param name and secret name succeeds', async () => {
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'http://localhost' },
        });
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        testProcessor.setup('apiParamName', 'secretName');
    });

    test('evidence setup without api param name throws error', async () => {
        const task = () => testProcessor.setup('', 'secretName');

        await expect(task).rejects.toThrowError();
    });

    test('evidence setup without api secretName name throws error', async () => {
        const task = () => testProcessor.setup('apiParamName', '');

        await expect(task).rejects.toThrowError();
    });

    test('evidence setup fails to retrieve api key throws error', async () => {
        const localTestProcessor = new EvidenceProducer();
        getSecretsResponse.mockRejectedValueOnce({});
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'http://localhost' },
        });
        const task = () => localTestProcessor.setup('apiParamName', 'secretName');

        await expect(task).rejects.toThrowError();
    });

    test('evidence setup fails to retrieve api endpoint throws error', async () => {
        const localTestProcessor = new EvidenceProducer();
        getParameterResponse.mockRejectedValueOnce({});
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        const task = () => localTestProcessor.setup('apiParamName', 'secretName');

        await expect(task).rejects.toThrowError();
    });
});
