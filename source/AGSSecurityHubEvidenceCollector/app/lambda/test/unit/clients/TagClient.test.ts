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
import { SecurityHubFinding } from 'src/SecurityHubEvent';
import { getResourcesTags } from 'src/clients/TagClient';
import { getResourcesResponse } from 'test/__mocks__/@aws-sdk/client-resource-groups-tagging-api';
import { assumeRoleResponse } from 'test/__mocks__/@aws-sdk/client-sts';

const mockFinding: SecurityHubFinding = {
    AwsAccountId: '1234',
    CreatedAt: new Date().toISOString(),
    Description: 'my test finding',
    GeneratorId: '1234',
    Id: '1234',
    ProductArn: '1234',
    Resources: [],
    SchemaVersion: '1.0',
    Severity: { Label: 'INFORMATIONAL', Original: 'info' },
    Title: 'my title',
    Types: ['my type'],
    UpdatedAt: new Date().toISOString(),
    ProductName: 'Security Hub',
};

describe('Tag client tests', () => {
    beforeEach(() => {
        getResourcesResponse.mockClear();
        assumeRoleResponse.mockClear();
    });

    test('do nothing if all resouces have tags', async () => {
        const results = await getResourcesTags({
            ...mockFinding,
            Resources: [
                { Id: 'my-resource', Type: 'resource type', Tags: { key: 'value' } },
            ],
        });

        expect(results).toBeDefined();
        expect(getResourcesResponse).not.toHaveBeenCalled();
    });

    test('can get tags for resource', async () => {
        getResourcesResponse.mockResolvedValueOnce({
            ResourceTagMappingList: [
                {
                    ResourceARN: 'arn:aws:events:ap-southeast-2:132132131',
                    Tags: [{ Key: 'my-key', Value: 'my-value' }],
                },
            ],
        });
        assumeRoleResponse.mockResolvedValueOnce({
            Credentials: {
                SecretAccessKey: 'secret',
                AccessKeyId: 'access',
                Expiration: 'expr',
                SessionToken: 'token',
            },
        });

        const results = await getResourcesTags({
            ...mockFinding,
            Resources: [
                { Id: 'arn:aws:events:ap-southeast-2:132132131', Type: 'resource' },
            ],
        });
        console.log(results);
        expect(results).toBeDefined();
        expect(results.Resources[0]?.Tags).toBeDefined();
    });

    test('can enrich the correct resources with tags', async () => {
        getResourcesResponse.mockResolvedValueOnce({
            ResourceTagMappingList: [
                {
                    ResourceARN: 'arn:aws:events:ap-southeast-2:132132131',
                    Tags: [{ Key: 'key132', Value: 'value132' }],
                },
            ],
        });
        assumeRoleResponse.mockResolvedValueOnce({
            Credentials: {
                SecretAccessKey: 'secret',
                AccessKeyId: 'access',
                Expiration: 'expr',
                SessionToken: 'token',
            },
        });
        const results = await getResourcesTags({
            ...mockFinding,
            Resources: [
                { Id: 'arn:aws:events:ap-southeast-2:050505050', Type: 'resource' },
                { Id: 'arn:aws:events:ap-southeast-2:132132131', Type: 'resource' },
            ],
        });

        expect(results.Resources[0]?.Id).toStrictEqual(
            'arn:aws:events:ap-southeast-2:050505050'
        );
        expect(JSON.stringify(results.Resources[0]?.Tags)).toBeUndefined();

        expect(results.Resources[1]?.Id).toStrictEqual(
            'arn:aws:events:ap-southeast-2:132132131'
        );
        expect(JSON.stringify(results.Resources[1]?.Tags)).toStrictEqual(
            JSON.stringify({ key132: 'value132' })
        );
    });

    test('does not throw error if tag response contains no tags', async () => {
        getResourcesResponse.mockResolvedValueOnce({});
        assumeRoleResponse.mockResolvedValueOnce({
            Credentials: {
                SecretAccessKey: 'secret',
                AccessKeyId: 'access',
                Expiration: 'expr',
                SessionToken: 'token',
            },
        });
        const results = await getResourcesTags({
            ...mockFinding,
            Resources: [
                { Id: 'arn:aws:events:ap-southeast-2:132132131', Type: 'resource' },
            ],
        });

        expect(results).toBeDefined();
        expect(results.Resources[0]?.Tags).toBeUndefined();
    });

    test('does not error if failed to get a response from tag', async () => {
        getResourcesResponse.mockReturnValueOnce(Promise.reject(true));
        assumeRoleResponse.mockResolvedValueOnce({
            Credentials: {
                SecretAccessKey: 'secret',
                AccessKeyId: 'access',
                Expiration: 'expr',
                SessionToken: 'token',
            },
        });
        const result = await getResourcesTags({
            ...mockFinding,
            Resources: [
                { Id: 'arn:aws:events:ap-southeast-2:132132131', Type: 'resource' },
            ],
        });

        expect(result).toMatchObject({
            ...mockFinding,
            Resources: [
                { Id: 'arn:aws:events:ap-southeast-2:132132131', Type: 'resource' },
            ],
        });
    });

    test('does not error if failed to get a response from assume role', async () => {
        getResourcesResponse.mockResolvedValueOnce({
            ResourceTagMappingList: [
                {
                    ResourceARN: 'arn:aws:events:ap-southeast-2:132132131',
                    Tags: [{ Key: 'my-key', Value: 'my-value' }],
                },
            ],
        });
        assumeRoleResponse.mockReturnValueOnce(Promise.reject(true));
        const result = await getResourcesTags({
            ...mockFinding,
            Resources: [
                { Id: 'arn:aws:events:ap-southeast-2:132132131', Type: 'resource' },
            ],
        });

        expect(result).toMatchObject({
            ...mockFinding,
            Resources: [
                { Id: 'arn:aws:events:ap-southeast-2:132132131', Type: 'resource' },
            ],
        });
    });

    test('does not throw error if resources id does not have account info', async () => {
        getResourcesResponse.mockResolvedValueOnce({});
        assumeRoleResponse.mockResolvedValueOnce({
            Credentials: {
                SecretAccessKey: 'secret',
                AccessKeyId: 'access',
                Expiration: 'expr',
                SessionToken: 'token',
            },
        });
        const results = await getResourcesTags({
            ...mockFinding,
            Resources: [{ Id: 'not-a-valid-resource-id', Type: 'resource' }],
        });

        expect(results).toBeDefined();
        expect(results.Resources[0]?.Tags).toBeUndefined();
    });
});
