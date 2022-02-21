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
import { getArn } from 'src/clients/ConfigClient';
import { batchGetResourceResponse } from 'test/__mocks__/@aws-sdk/client-config-service';
import { assumeRoleResponse } from 'test/__mocks__/@aws-sdk/client-sts';

describe('Config client tests', () => {
    test('can retrieve resource arn', async () => {
        const testCreds = {
            SecretAccessKey: 'secret',
            AccessKeyId: 'access',
            Expiration: 'expr',
            SessionToken: 'token',
        };
        assumeRoleResponse.mockResolvedValueOnce({ Credentials: testCreds });
        batchGetResourceResponse.mockResolvedValueOnce({
            baseConfigurationItems: [{ arn: 'resourceArn' }],
        });
        const response = await getArn(
            'resourceId',
            'resourceType',
            'awsAccount',
            'awsRegion'
        );

        expect(response).toEqual('resourceArn');
    });

    test('can return resource id if received an empty response from config client', async () => {
        const testCreds = {
            SecretAccessKey: 'secret',
            AccessKeyId: 'access',
            Expiration: 'expr',
            SessionToken: 'token',
        };
        assumeRoleResponse.mockResolvedValueOnce({ Credentials: testCreds });
        batchGetResourceResponse.mockResolvedValueOnce({});
        const response = await getArn(
            'resourceId',
            'resourceType',
            'awsAccount',
            'awsRegion'
        );

        expect(response).toEqual('resourceId');
    });

    test('throw error if we cannot assume role', async () => {
        assumeRoleResponse.mockRejectedValueOnce({});
        batchGetResourceResponse.mockResolvedValueOnce({});
        await expect(
            getArn('resourceId', 'resourceType', 'awsAccount', 'awsRegion')
        ).rejects.toThrow();
    });
});
