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
import 'reflect-metadata';

import { anyString, anything, instance, mock, reset, when } from 'ts-mockito';

import { EvidenceProviderData } from 'src/data/schemas/EvidenceProviderData';
import { EvidenceProviderRepository } from 'src/data/EvidenceProviderRepository';
import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { AWSError } from 'test/TestHelpers';
import { EvidenceSchemaRepository } from 'src/data/EvidenceSchemaRepository';
import { ApiKeyRepository } from 'src/data/ApiKeyRepository';

const repo: EvidenceProviderRepository = mock(EvidenceProviderRepository);
const schemaRepo: EvidenceSchemaRepository = mock(EvidenceSchemaRepository);
const apiKeyRepo: ApiKeyRepository = mock(ApiKeyRepository);
const service = new EvidenceProviderService(
    instance(repo),
    instance(schemaRepo),
    instance(apiKeyRepo)
);
const providerData: EvidenceProviderData = {
    providerId: '1234',
    enabled: true,
    createdTimestamp: new Date().toISOString(),
    name: 'authority',
    apiKeyHash: '1234',
    schemaIds: [],
};

describe('Evidence provider service tests', () => {
    beforeEach(() => {
        reset();
        jest.clearAllMocks();
    });

    test('can create new evidence provider', async () => {
        // arrange
        when(repo.isValidProvider(anything(), 'name')).thenResolve(true);
        when(apiKeyRepo.createApiKey(anyString())).thenResolve('my-api-key');
        when(repo.createEvidenceProvider(anything())).thenCall(
            (arg: EvidenceProviderData) => arg
        );

        // act
        const provider = await service.createEvidenceProvider({
            name: 'name',
            description: 'description',
            schemas: [{ schemaId: '123', content: { type: 'string' } }],
        });

        // assert
        expect(provider).not.toBeUndefined();
        expect(provider.name).toBe('name');
        expect(provider.description).toBe('description');
        expect(provider.apiKey).toBe('my-api-key');
        expect.assertions(4);
    });

    test('can create new authority with evidence schemas', async () => {
        // arrange
        when(repo.isValidProvider(anything(), 'name')).thenResolve(true);

        when(repo.createEvidenceProvider(anything())).thenCall(
            (arg: EvidenceProviderData) => arg
        );
        const spy = jest.spyOn(instance(schemaRepo), 'createSchema');

        // act
        const provider = await service.createEvidenceProvider({
            name: 'name',
            description: 'description',
            schemas: [
                { content: {}, schemaId: 'schema1' },
                { content: {}, schemaId: 'schema2' },
            ],
        });

        // assert
        expect(provider).not.toBeUndefined();
        expect(provider.name).toBe('name');
        expect(provider.description).toBe('description');
        expect(spy).toHaveBeenCalledTimes(2);
    });

    test('throws error if selected providerId or name already exists', async () => {
        // arrange
        when(repo.isValidProvider('1234', 'test')).thenResolve(false);

        // act
        const task = () =>
            service.createEvidenceProvider({
                providerId: '1234',
                name: 'test',
                schemas: [{ schemaId: '123', content: { type: 'string' } }],
            });

        // assert
        await expect(task()).rejects.toEqual({
            message: 'A provider with the given providerId and/or name already exists.',
            name: 'AGSError',
            retryable: false,
            statusCode: 400,
        });
    });

    test('can create new provider with given id', async () => {
        // arrange
        when(repo.isValidProvider('my-new-authority', 'test')).thenResolve(true);
        when(repo.createEvidenceProvider(anything())).thenCall(
            (arg: EvidenceProviderData) => arg
        );

        // act
        const provider = await service.createEvidenceProvider({
            providerId: 'my-new-authority',
            name: 'test',
            schemas: [{ schemaId: '123', content: { type: 'string' } }],
        });

        // assert
        expect(provider.providerId).toBe('my-new-authority');
    });
});

describe('getProviderById tests', () => {
    beforeEach(() => reset());
    test('can get evidence provider by id', async () => {
        // arrange
        when(repo.getEvidenceProvider('1234')).thenResolve(providerData);

        // act
        const provider = await service.getEvidenceProviderById('1234');

        // assert
        expect(provider).not.toBeUndefined();
        expect(provider?.providerId).toBe('1234');
    });

    test('return undefined if provider not found', async () => {
        // arrange
        when(repo.getEvidenceProvider('1234')).thenResolve(undefined);

        // act
        const provider = await service.getEvidenceProviderById('1234');

        // assert
        expect(provider).toBeUndefined();
    });
});

describe('toggleProviderStatus tests', () => {
    beforeEach(() => reset());

    test('throw error if provider not found', async () => {
        // arrange
        when(repo.toggleProviderStatus('1234', false)).thenReject(
            new AWSError('ConditionalCheckFailedException')
        );

        const task = async () => service.toggleProviderStatus('1234', false);

        // act && assert
        await expect(task()).rejects.toEqual({
            message: 'Could not find evidence provider with the given providerId.',
            name: 'AGSError',
            retryable: false,
            statusCode: 400,
        });
    });

    test('can toggle provider status', async () => {
        // arrange
        when(repo.toggleProviderStatus('1234', false)).thenResolve({
            ...providerData,
            enabled: false,
        });

        // act
        const provider = await service.toggleProviderStatus('1234', false);

        // assert
        expect(provider.enabled).toBe(false);
    });
});

describe('createEvidenceSchema tests', () => {
    beforeEach(() => {
        reset();
        jest.clearAllMocks();
    });

    test('throw error if authority not found', async () => {
        // arrange
        when(repo.getEvidenceProvider('1234')).thenResolve(undefined);
        const task = async () =>
            service.createEvidenceSchema({
                providerId: '1234',
                schemaId: '123',
                content: {},
            });

        // act && assert
        await expect(task()).rejects.toEqual({
            message: 'Could not find evidence provider with the given providerId.',
            name: 'AGSError',
            retryable: false,
            statusCode: 400,
        });
    });

    test('throw error on duplicate shema', async () => {
        // arrange
        when(repo.getEvidenceProvider('1234')).thenResolve(providerData);
        when(schemaRepo.createSchema(anything())).thenReject(
            new AWSError('ConditionalCheckFailedException')
        );

        const task = () =>
            service.createEvidenceSchema({
                providerId: '1234',
                schemaId: '123',
                content: {},
            });

        // act & assert
        await expect(task()).rejects.toEqual({
            message: 'A schema with the same id already exists.',
            name: 'AGSError',
            retryable: false,
            statusCode: 400,
        });
    });

    test('can create evidence schema', async () => {
        // arrange
        when(repo.getEvidenceProvider('1234')).thenResolve(providerData);
        when(schemaRepo.createSchema(anything())).thenResolve();

        const spy = jest.spyOn(instance(schemaRepo), 'createSchema');
        const spy2 = jest.spyOn(instance(repo), 'addSchemaId');

        // act
        await service.createEvidenceSchema({
            providerId: '1234',
            schemaId: '123',
            content: {},
        });

        // assert
        expect(spy).toBeCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
    });

    test(`don't update provider table for test schema (one with ttl)`, async () => {
        // arrange
        when(repo.getEvidenceProvider('1234')).thenResolve(providerData);
        when(schemaRepo.createSchema(anything())).thenResolve();

        const spy = jest.spyOn(instance(schemaRepo), 'createSchema');
        const spy2 = jest.spyOn(instance(repo), 'addSchemaId');

        // act
        await service.createEvidenceSchema(
            {
                providerId: '1234',
                schemaId: '123',
                content: {},
            },
            123
        );

        // assert
        expect(spy).toBeCalledTimes(1);
        expect(spy2).not.toHaveBeenCalled();
    });
});

describe('getEvidenceSchema tests', () => {
    test('returns null if schema not found', async () => {
        // arrange
        when(schemaRepo.getSchema('123', '123')).thenResolve(null);

        // act
        const schema = await service.getEvidenceSchema({
            providerId: '123',
            schemaId: '123',
        });

        // assert
        expect(schema).toBeNull();
    });

    test('can get schema by id', async () => {
        // arrange
        when(schemaRepo.getSchema('123', '123')).thenResolve({
            providerId: '123',
            schemaId: '123',
            content: { succeed: true },
            createdTimestamp: '2021-05-28T09:41:50.024Z',
        });

        // act
        const schema = await service.getEvidenceSchema({
            providerId: '123',
            schemaId: '123',
        });

        // assert
        expect(schema).not.toBeNull();
        expect(schema).toEqual({
            providerId: '123',
            schemaId: '123',
            content: { succeed: true },
            createdTimestamp: '2021-05-28T09:41:50.024Z',
        });
    });
});

describe('listProvider tests', () => {
    test('can list providers', async () => {
        // arrange
        when(
            repo.listEvidenceProvider(
                10,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            )
        ).thenResolve({
            pageSize: 10,
            records: [
                {
                    providerId: 'authority1',
                    apiKeyHash: '123456',
                    createdTimestamp: new Date().toISOString(),
                    name: 'my-authority',
                    enabled: true,
                    schemaIds: ['45677'],
                },
                {
                    providerId: 'authority2',
                    apiKeyHash: '123456',
                    createdTimestamp: new Date().toISOString(),
                    name: 'my-authority-2',
                    enabled: true,
                    schemaIds: ['12345'],
                },
            ],
        });

        // act
        const result = await service.listEvidenceProviders({ limit: 10 });

        // assert
        expect(result.results.length).toBe(2);
        expect(result.results[0].schemas?.length).toBe(1);
        expect(result.results[1].schemas?.length).toBe(1);
    });

    test('return empty array if no provider found', async () => {
        // arrange
        when(
            repo.listEvidenceProvider(
                10,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            )
        ).thenResolve({
            pageSize: 10,
            records: [],
        });

        // act
        const response = await service.listEvidenceProviders({ limit: 10 });

        // assert
        expect(response.results.length).toBe(0);
    });
});
