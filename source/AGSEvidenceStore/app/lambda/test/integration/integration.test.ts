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
import AWS from 'aws-sdk';
import {
    EvidenceProviderOutput,
    CreateEvidenceProviderOutput,
} from 'src/types/EvidenceProviderOutput';
import { CreateEvidenceProviderInput } from 'src/types/CreateEvidenceProviderInput';
import { CreateEvidenceInput } from 'src/types/CreateEvidenceInput';
import { FullEvidenceOutput } from 'src/types/EvidenceOutput';
import { sleep } from '../../canary/CanaryHelper';
import { QueryOutput } from 'src/types/QueryOutput';
import { CreateEvidenceSchemaInput } from 'src/types/CreateEvidenceSchemaInput';
import { get, post, put } from './restClientHelper';
import { EvidenceVerificationStatusOutput } from 'src/types/EvidenceVerificationStatusOutput';
import { GetEvidencesInput } from 'src/types/GetEvidencesInput';

jest.setTimeout(30000);

const ssm = new AWS.SSM({
    region: 'ap-southeast-2',
});

let apiBaseUrl: string;
let provider: CreateEvidenceProviderOutput;
let evidence: FullEvidenceOutput;

describe('Evidence service integration tests', () => {
    beforeAll(async () => {
        const response = await ssm
            .getParameter({
                Name: '/ags/endpoints/AGSEvidenceStore',
            })
            .promise();

        if (response.Parameter?.Value) {
            apiBaseUrl = response.Parameter.Value.replace(/\/+$/, '');
        } else {
            throw Error('Cannot find service endpoitn url in SSM param store.');
        }
    });

    describe('authority management tests', () => {
        test('can create new evidence provider', async () => {
            const request: CreateEvidenceProviderInput = {
                name: 'integration-test-authority',
                description: 'created by an integration test runner',
                schemas: [{ schemaId: 'test-schema', content: { value: 'string' } }],
            };

            const response = await post<CreateEvidenceProviderOutput>(
                `${apiBaseUrl}/providers`,
                request
            );

            expect(response.statusCode).toBe(201);
            provider = response.data!;
            expect(provider.providerId).not.toBeUndefined();
            expect(provider.name).toBe('integration-test-authority');
        });

        test('can get evidence provider by id', async () => {
            const response = await get<EvidenceProviderOutput>(
                `${apiBaseUrl}/providers/${provider.providerId}`
            );

            expect(response.statusCode).toBe(200);

            expect(response.data).not.toBeUndefined();
            expect(response.data?.providerId).toBe(provider.providerId);
        });

        test.each([false, true])(
            'can enable/disable evidence provider',
            async (enabled: boolean) => {
                await sleep(1000);
                const response = await put<EvidenceProviderOutput>(
                    `${apiBaseUrl}/providers/${provider.providerId}`,
                    {
                        providerId: provider.providerId,
                        enabled,
                    }
                );

                expect(response.statusCode).toBe(200);
                expect(response.data).not.toBeUndefined();
                expect(response.data?.enabled).toBe(enabled);
            }
        );

        test('can create new schema', async () => {
            const request: CreateEvidenceSchemaInput = {
                providerId: provider.providerId,
                content: { newField: 'value' },
                schemaId: 'new-schema',
            };

            const response = await post<any>(
                `${apiBaseUrl}/providers/${provider.providerId}/schemas`,
                request
            );

            expect(response.statusCode).toBe(201);
        });

        test('can get schema by id', async () => {
            const response = await get(
                `${apiBaseUrl}/providers/${provider.providerId}/schemas/new-schema`
            );

            expect(response.statusCode).toBe(200);
        });

        test('can search for authority', async () => {
            const response = await get<QueryOutput<EvidenceProviderOutput>>(
                `${apiBaseUrl}/providers?providerId=${provider.providerId}&name=${provider.name}&description=${provider.description}&schemaId=${provider.schemas?.[0].schemaId}`
            );

            expect(response.statusCode).toBe(200);
            expect(response.data?.results.length).toBeGreaterThan(0);
        });
    });

    describe('evidence management tests', () => {
        test('can create new evidence', async () => {
            await sleep(5000); // gotta wait for api key to be fully operational and usable
            const request: CreateEvidenceInput = {
                providerId: provider.providerId,
                schemaId: 'test-schema',
                targetId: 'my-release',
                content: { value: '123' },
                additionalTargetIds: ['my-dependency', 'my-artifact'],
                metadata: { key: 'value' },
            };

            const response = await post<FullEvidenceOutput>(
                `${apiBaseUrl}/evidences`,
                request,
                { 'x-api-key': provider.apiKey }
            );

            expect(response.statusCode).toBe(201);
            expect(response.data).not.toBeUndefined();
            expect(response.data?.targetId).toBe('my-release');
            expect(response.data?.additionalTargetIds?.length).toBe(2);
            expect(response.data?.metadata?.key).toBe('value');
            evidence = response.data!;
        });

        test('can get evidence by id', async () => {
            await sleep(5000); // waiting for evidence to be replicated across to ES
            const response = await get(`${apiBaseUrl}/evidences/${evidence.evidenceId}`);

            expect(response.statusCode).toBe(200);
            expect(response.data).toMatchObject(evidence);
        });

        test('can search for evidences by targetIds', async () => {
            await sleep(5000);
            const response = await post<QueryOutput<FullEvidenceOutput>>(
                `${apiBaseUrl}/evidences/search`,
                { targetIds: [evidence.targetId] }
            );

            expect(response.statusCode).toBe(200);

            expect(response.data?.total).toBeGreaterThan(0);
            expect(response.data?.results.length).toBeGreaterThan(0);
        });

        test('can get evidence verification status', async () => {
            const response = await get<EvidenceVerificationStatusOutput>(
                `${apiBaseUrl}/evidences/${evidence.evidenceId}/verificationstatus`
            );

            expect(response.statusCode).toBe(200);

            expect(response.data?.verificationStatus).toBe('Verified');
            expect(response.data?.evidence).not.toBeUndefined();
        });

        test('can create new revision of an existing evidence', async () => {
            const request: CreateEvidenceInput = {
                providerId: provider.providerId,
                schemaId: 'test-schema',
                targetId: 'my-release',
                content: { value: '123' },
                additionalTargetIds: ['my-dependency', 'my-artifact'],
                metadata: { key: 'newValue' },
            };

            const response = await post<FullEvidenceOutput>(
                `${apiBaseUrl}/evidences`,
                request,
                { 'x-api-key': provider.apiKey }
            );

            expect(response.statusCode).toBe(201);
            expect(response.data).not.toBeUndefined();
            expect(response.data?.evidenceId).toBe(evidence.evidenceId);
            expect(response.data?.targetId).toBe(evidence.targetId);
            expect(response.data?.additionalTargetIds?.length).toBe(
                evidence.additionalTargetIds?.length
            );
            expect(response.data?.metadata?.key).toBe('newValue');
        });

        test('can get evidence revisions', async () => {
            await sleep(5000);
            const response = await get<QueryOutput<FullEvidenceOutput>>(
                `${apiBaseUrl}/evidences/${evidence.evidenceId}/revisions`
            );

            expect(response.statusCode).toBe(200);
            expect(response.data?.results.length).toBe(2);
        });

        test('can search for evidences', async () => {
            const request: GetEvidencesInput = {
                providerId: provider.providerId,
                schemaId: evidence.schemaId,
                content: 'value',
            };

            console.debug('search query ', request);

            const response = await post<QueryOutput<FullEvidenceOutput>>(
                `${apiBaseUrl}/evidences/search`,
                request
            );

            expect(response.statusCode).toBe(200);
            expect(response.data?.results.length).toBeGreaterThan(0);
        });
    });
});
