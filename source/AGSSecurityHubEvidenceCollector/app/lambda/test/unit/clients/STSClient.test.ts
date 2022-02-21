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
import { assumeRole } from 'src/clients/STSClient';
import { assumeRoleResponse } from 'test/__mocks__/@aws-sdk/client-sts';

describe('STS client tests', () => {
    test('can retrieve assume role credentials', async () => {
        const testCreds = {
            SecretAccessKey: 'secret',
            AccessKeyId: 'access',
            Expiration: 'expr',
            SessionToken: 'token',
        };
        assumeRoleResponse.mockResolvedValueOnce({ Credentials: testCreds });
        const response = await assumeRole('test-role', 'test-session');
        console.log(response);
        expect(response).toEqual({
            secretAccessKey: 'secret',
            accessKeyId: 'access',
            expiration: 'expr',
            sessionToken: 'token',
        });
    });

    test('throws error if returned credentials are undefined', async () => {
        assumeRoleResponse.mockResolvedValueOnce({});
        const task = () => assumeRole('test-role', 'test-session');

        await expect(task).rejects.toThrowError();
    });

    test('throws error if call to sts client fails', async () => {
        assumeRoleResponse.mockReturnValueOnce(Promise.reject(true));
        const task = () => assumeRole('test-role', 'test-session');

        await expect(task).rejects.toThrowError();
    });
});
