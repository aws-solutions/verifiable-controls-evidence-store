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
import { SecretsManagerClient } from 'src/clients/SecretManagerClient';
import { getSecretsResponse } from 'test/__mocks__/@aws-sdk/client-secrets-manager';

describe('Secret manager client tests', () => {
    beforeEach(() => {
        //@ts-ignore
        SecretsManagerClient._instance = undefined;
        getSecretsResponse.mockClear();
    });

    test('can get api key', async () => {
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'my-uber-api-key' });
        const smClient = SecretsManagerClient.getInstance();
        const apiKey = await smClient.getSecretKey('my-secret-name');

        expect(apiKey).toBe('my-uber-api-key');
    });

    test('secretsmanager is invoked once when getting evidence store api twice', async () => {
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'my-uber-api-key' });
        const smClient = SecretsManagerClient.getInstance();
        const apiKey1 = await smClient.getSecretKey('my-secret-name');
        const apiKey2 = await smClient.getSecretKey('my-secret-name');

        expect(apiKey1).toBe('my-uber-api-key');
        expect(apiKey2).toBe('my-uber-api-key');
        expect(getSecretsResponse).toBeCalledTimes(1);
    });

    test('throws error if secret does not have a value', async () => {
        getSecretsResponse.mockResolvedValueOnce({});
        const smClient = SecretsManagerClient.getInstance();

        const task = () => smClient.getSecretKey('my-secret-name');

        await expect(task).rejects.toThrowError();
    });

    test('throws error if call to secrets manager fails', async () => {
        getSecretsResponse.mockReturnValueOnce(Promise.reject(true));
        const smClient = SecretsManagerClient.getInstance();
        const task = () => smClient.getSecretKey('my-secret-name');

        await expect(task).rejects.toThrowError();
    });
});
