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

import { EvidenceProviderRepository } from 'src/data/EvidenceProviderRepository';
import { EvidenceContentRepository } from 'src/data/EvidenceContentRepository';
import { ElasticSearchEvidenceData } from 'src/data/schemas/EvidenceDataWithContent';
import { EvidenceRepository } from 'src/data/EvidenceRepository';
import { EvidenceService } from 'src/services/EvidenceService';
import { CreateEvidenceInput } from 'src/types/CreateEvidenceInput';
import { GetEvidencesInput } from 'src/types/GetEvidencesInput';
import {
    generatePaginationToken,
    parsePaginationToken,
} from 'src/services/PaginationTokenHelper';
import { StaticLoggerFactory } from '@apjsb-serverless-lib/logger';
import { EvidenceSchemaRepository } from 'src/data/EvidenceSchemaRepository';
import {
    EvidenceProviderData,
    EvidenceSchemaData,
} from 'src/data/schemas/EvidenceProviderData';
import { QldbHelper } from 'src/data/QldbHelper';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';

jest.useFakeTimers();

const providerRepo = mock(EvidenceProviderRepository);
const evidenceRepo = mock(EvidenceRepository);
const schemaRepo = mock(EvidenceSchemaRepository);
const evidenceContentRepo = mock(EvidenceContentRepository);
const qldbHelper = mock(QldbHelper);
const appConfig = new AppConfiguration('unittest');

const service = new EvidenceService(
    instance(evidenceRepo),
    instance(providerRepo),
    instance(schemaRepo),
    instance(evidenceContentRepo),
    instance(qldbHelper),
    new StaticLoggerFactory(),
    appConfig
);

const evidenceData: ElasticSearchEvidenceData = {
    compositeKey: 'composite-key',
    evidenceId: '1234',
    providerId: '1234',
    providerName: 'name',
    contentHash: 'OdFg6X4r6gewzxxkcln/pPC9Bwaduk5sGaItOLQIUQ8=',
    contentLocation: 'https://bucket.s3.amazonaws.com/key/file',
    createdTimestamp: new Date().toISOString(),
    inputHash: 'inputHash',
    targetId: 'targetId',
    content: { succeed: true },
    contentString: JSON.stringify({ succeed: true }),
    schemaId: 'schema-id',
    revisionDetails: {
        digest: { digest: '1234' },
        metadata: { id: 'id', version: 123, txTime: 'any', txId: 'string' },
        blockAddress: { sequenceNo: 123, strandId: 'strandId' },
        hash: 'revision-hash',
    },
};

describe('create evidence tests', () => {
    const input: CreateEvidenceInput & { apiKey: string } = {
        providerId: '123',
        content: { succeed: true },
        targetId: '456',
        apiKey: 'apiKey',
        schemaId: 'schema-id',
    };

    const provider: EvidenceProviderData = {
        providerId: '123',
        name: 'name',
        enabled: true,
        createdTimestamp: new Date().toISOString(),
        apiKeyHash: 'YepBE/VrpujNsxPutNlTvmuil5ZhQEbFKB1ee0aKJ2U=',
        schemaIds: [],
    };

    const schema: EvidenceSchemaData = {
        providerId: '123',
        schemaId: 'schema-id',
        content: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                succeed: {
                    type: 'boolean',
                },
            },
            required: ['succeed'],
        },
        createdTimestamp: new Date().toISOString(),
    };

    afterEach(() => {
        reset();
        jest.clearAllMocks();
    });

    test('throw error if invalid providerId', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('123')).thenReturn();
        const createTask = async () => service.createEvidence(input);

        // act && assert
        await expect(createTask()).rejects.toEqual({
            message: 'Could not find evidence provider with the given providerId.',
            name: 'AGSError',
            retryable: false,
            statusCode: 400,
        });
    });

    test('throw error if provider is not enabled', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('123')).thenResolve({
            providerId: '123',
            enabled: false,
            name: 'test',
            createdTimestamp: '',
            apiKeyHash: 'mykey',
            schemaIds: [],
        });

        const createTask = async () => service.createEvidence(input);

        // act && assert
        await expect(createTask()).rejects.toEqual({
            message: 'Provider with id 123 is not enabled.',
            name: 'AGSError',
            retryable: false,
            statusCode: 422,
        });
    });

    test('throw error if mismatched api key', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('123')).thenResolve({
            providerId: '123',
            enabled: true,
            name: 'test',
            createdTimestamp: '',
            apiKeyHash: 'mykey-1',
            schemaIds: [],
        });

        const createTask = async () => service.createEvidence(input);

        // act && assert
        await expect(createTask()).rejects.toEqual({
            message: 'Provider with id 123 is not allowed to use the provided api key.',
            name: 'AGSError',
            retryable: false,
            statusCode: 403,
        });
    });

    test('throw error if schema not found', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('123')).thenResolve(provider);
        when(schemaRepo.getSchema('123', 'schema-id')).thenResolve(null);

        const createTask = async () => service.createEvidence(input);

        // act && assert
        await expect(createTask()).rejects.toEqual({
            message: 'Could not find Schema with id schema-id for authority with id 123.',
            name: 'AGSError',
            retryable: false,
            statusCode: 400,
        });
    });

    test('throw error if evidence schema validation fails', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('123')).thenResolve(provider);
        when(schemaRepo.getSchema('123', 'schema-id')).thenResolve(schema);

        const createTask = async () =>
            service.createEvidence({ ...input, content: { succeed: 'done' } });

        // act && assert
        await expect(createTask()).rejects.toEqual({
            message:
                'JSON schema validation failure - instance.succeed is not of a type(s) boolean',
            name: 'AGSError',
            retryable: false,
            statusCode: 400,
        });
    });

    test('can create new evidence', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('123')).thenResolve(provider);
        when(schemaRepo.getSchema('123', 'schema-id')).thenResolve(schema);
        when(evidenceContentRepo.putContent(anything())).thenResolve('host/key1/key2');
        when(evidenceRepo.createEvidence(anything())).thenResolve();
        when(evidenceRepo.getEvidenceByHashValue(anyString())).thenResolve(undefined);

        // act
        const evidence = await service.createEvidence(input);

        // assert
        expect(evidence).not.toBeUndefined();
        expect(evidence.createdTimestamp).not.toBeUndefined();
        expect(evidence.evidenceId).not.toBeUndefined();
        expect(evidence.attachments).toBeUndefined();
    });

    test('can create new evidence with attachments', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('123')).thenResolve(provider);
        when(schemaRepo.getSchema('123', 'schema-id')).thenResolve(schema);
        when(evidenceContentRepo.putContent(anything())).thenResolve('host/key1/key2');
        when(
            evidenceContentRepo.getEvidenceContent(anything(), 'attachment1')
        ).thenResolve('my-attachment-data');
        when(evidenceRepo.createEvidence(anything())).thenResolve();
        when(evidenceRepo.getEvidenceByHashValue(anyString())).thenResolve(undefined);

        // act
        const evidence = await service.createEvidence({
            ...input,
            attachments: [{ objectKey: 'attachment1' }],
        });

        // assert
        expect(evidence).not.toBeUndefined();
        expect(evidence.createdTimestamp).not.toBeUndefined();
        expect(evidence.evidenceId).not.toBeUndefined();
        expect(evidence.attachments).not.toBeUndefined();
        expect(evidence.attachments?.length).toBe(1);
    });

    test('throw error if unable to download attachment', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('123')).thenResolve(provider);
        when(schemaRepo.getSchema('123', 'schema-id')).thenResolve(schema);
        when(evidenceContentRepo.putContent(anything())).thenResolve('host/key1/key2');
        when(
            evidenceContentRepo.getEvidenceContent(anything(), 'attachment1')
        ).thenResolve(null);
        when(evidenceRepo.createEvidence(anything())).thenResolve();
        when(evidenceRepo.getEvidenceByHashValue(anyString())).thenResolve(undefined);

        // act
        const createTask = () =>
            service.createEvidence({
                ...input,
                attachments: [{ objectKey: 'attachment1' }],
            });

        // assert
        await expect(createTask()).rejects.toEqual({
            message:
                'Unable to download attachment with objectKey attachment1, the object appears to be empty',
            name: 'AGSError',
            retryable: false,
            statusCode: 400,
        });
    });

    test('should not commit the same evidence multiple times', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('providerId')).thenResolve(provider);
        when(schemaRepo.getSchema('providerId', 'schema-id')).thenResolve(schema);
        when(evidenceRepo.getEvidenceByHashValue(anyString())).thenResolve([
            generateEvidenceRecord(),
        ]);
        const spy = jest.spyOn(evidenceRepo, 'createEvidence');

        // act
        const result = await service.createEvidence({
            providerId: 'providerId',
            targetId: 'target1',
            content: {
                succeed: true,
            },
            apiKey: 'apiKey',
            schemaId: 'schema-id',
        });

        // assert
        expect(result).not.toBeUndefined();
        expect(result.evidenceId).toBe('evidenceId');
        expect(result.providerId).toBe('providerId');
        expect(result.targetId).toBe('target1');
        expect(spy).not.toBeCalled();
    });

    test('delete evidence content when failing to persist evidence record', async () => {
        // arrange
        const spy = jest.spyOn(evidenceContentRepo, 'deleteContent');
        when(providerRepo.getEvidenceProvider('123')).thenResolve(provider);
        when(schemaRepo.getSchema('123', 'schema-id')).thenResolve(schema);
        when(evidenceRepo.getEvidenceByHashValue(anyString())).thenResolve(undefined);
        when(evidenceContentRepo.putContent(anything())).thenResolve('host/key1/key2');
        when(evidenceRepo.createEvidence(anything())).thenReject(
            new Error('something happened')
        );
        when(evidenceContentRepo.deleteContent(anything()));

        // act
        try {
            await service.createEvidence(input);
        } catch (error) {
            expect(spy).toBeCalledTimes(1);
        }
    });

    test('return additional target Ids and metadata is provided in the create evidence input', async () => {
        // arrange
        when(providerRepo.getEvidenceProvider('123')).thenResolve(provider);
        when(schemaRepo.getSchema('123', 'schema-id')).thenResolve(schema);
        when(evidenceContentRepo.putContent(anything())).thenResolve('host/key1/key2');
        when(evidenceRepo.createEvidence(anything())).thenResolve();
        when(evidenceRepo.getEvidenceByHashValue(anyString())).thenResolve(undefined);

        // act
        const evidence = await service.createEvidence({
            ...input,
            additionalTargetIds: ['target1', 'target2'],
            metadata: {
                generatedBy: 'jest',
            },
        });

        // assert
        expect(evidence).not.toBeUndefined();
        expect(evidence.createdTimestamp).not.toBeUndefined();
        expect(evidence.evidenceId).not.toBeUndefined();
        expect(evidence.additionalTargetIds).not.toBeUndefined();
        expect(evidence.additionalTargetIds![0]).toBe('target1');
        expect(evidence.additionalTargetIds![1]).toBe('target2');
        expect(evidence.metadata?.generatedBy).toBe('jest');
    });

    test('update existing evidence if the same providerId, targetIds, schemaId are provided', async () => {
        // arrange
        const spyUpdate = jest.spyOn(evidenceRepo, 'updateEvidence');
        const spyCreate = jest.spyOn(evidenceRepo, 'createEvidence');

        when(providerRepo.getEvidenceProvider('123')).thenResolve(provider);
        when(schemaRepo.getSchema('123', 'schema-id')).thenResolve(schema);
        when(evidenceContentRepo.putContent(anything())).thenResolve('host/key1/key2');
        when(evidenceRepo.updateEvidence(anything())).thenResolve();
        when(evidenceRepo.getEvidenceByHashValue(anyString())).thenResolve(undefined);
        when(evidenceRepo.getEvidenceByCompositeKey(anything())).thenResolve(
            evidenceData
        );

        // act
        const evidence = await service.createEvidence(input);

        // assert
        expect(evidence).not.toBeUndefined();
        expect(evidence.createdTimestamp).not.toBeUndefined();
        expect(evidence.evidenceId).not.toBeUndefined();
        expect(spyUpdate).toHaveBeenCalledTimes(1);
        expect(spyCreate).toHaveBeenCalledTimes(0);
    });
});

describe('get evidence by id tests', () => {
    test('can get evidence by id', async () => {
        // arrange
        when(evidenceRepo.getEvidenceById('1234')).thenResolve(evidenceData);

        // act
        const evidence = await service.getEvidenceById('1234');

        // assert
        expect(evidence).not.toBeUndefined();
    });

    test('can get evidence by id with attachments', async () => {
        // arrange
        when(evidenceRepo.getEvidenceById('1234')).thenResolve({
            ...evidenceData,
            attachments: [{ objectKey: 'firstkey', hash: '1234', bucketName: 'bucket' }],
        });

        // act
        const evidence = await service.getEvidenceById('1234');

        // assert
        expect(evidence).not.toBeUndefined();
        expect(evidence?.attachments?.length).toBe(1);
    });

    test('return null if evidence not found', async () => {
        // arrange
        when(evidenceRepo.getEvidenceById('1234')).thenResolve(null);

        // act
        const evidence = await service.getEvidenceById('1234');

        // assert
        expect(evidence).toBeUndefined();
    });

    test('return undefined if revision not found', async () => {
        // arrange
        when(evidenceRepo.getEvidenceRevision('1234', '0')).thenResolve(null);

        // act
        const result = await service.getEvidenceById('1234', '0');

        // assert
        expect(result).toBeUndefined();
    });

    test('can get revision', async () => {
        // arrange
        when(evidenceRepo.getEvidenceRevision('1234', '0')).thenResolve(
            generateEvidenceRecord()
        );

        // act
        const result = await service.getEvidenceById('1234', '0');

        // assert
        expect(result).not.toBeUndefined();
    });
});

describe('get evidences tests', () => {
    const input: GetEvidencesInput = {
        targetIds: ['target1', 'target2'],
        limit: 2,
    };

    test('can get evidences by targetIds', async () => {
        //arrange
        when(
            evidenceRepo.getEvidences(
                2,
                0,
                anything(),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            )
        ).thenResolve({
            pageSize: 2,
            records: [generateEvidenceRecord(), generateEvidenceRecord()],
            startIndex: 0,
            total: 5,
        });

        // act
        const result = await service.getEvidences(input);

        // assert
        expect(result.results.length).toBe(2);
        expect(result.total).toBe(5);
        expect(result.nextToken).not.toBeUndefined();

        const [startIndex, limit] = parsePaginationToken(result.nextToken);

        expect(startIndex).toBe(2);
        expect(limit).toBe(2);
    });

    test('do not generate pagination token if all records returned', async () => {
        //arrange
        when(
            evidenceRepo.getEvidences(
                2,
                0,
                anything(),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            )
        ).thenResolve({
            pageSize: 2,
            records: [generateEvidenceRecord(), generateEvidenceRecord()],
            startIndex: 0,
            total: 2,
        });

        // act
        const result = await service.getEvidences(input);

        // assert

        expect(result.nextToken).toBeUndefined();
    });
});

describe('verify evidence tests', () => {
    afterEach(() => {
        reset();
        jest.clearAllMocks();
    });

    test('throws error if evidence not found', async () => {
        // arrange
        when(evidenceRepo.getEvidenceById('1234')).thenResolve(null);

        const task = () => service.verifyEvidence('1234');

        // act & assert
        await expect(task()).rejects.toEqual({
            message: 'Evidence with id 1234 not found.',
            statusCode: 404,
            name: 'AGSError',
            retryable: false,
        });
    });

    test('throws error if unable to get evidence data from qldb', async () => {
        // arrange
        when(evidenceRepo.getEvidenceById('1234')).thenResolve(evidenceData);
        when(qldbHelper.verifyRevision(anything())).thenResolve(true);
        when(qldbHelper.verifyBlock(anything())).thenResolve(false);
        when(evidenceRepo.getEvidenceByIdFromSource('1234')).thenResolve(null);

        // act
        const result = await service.verifyEvidence('1234');

        // assert
        expect(result.verificationStatus).toBe('Unverified');
    });

    test.each([
        [false, false, false, 'Unverified'],
        [false, false, true, 'Unverified'],
        [false, true, false, 'Unverified'],
        [false, true, true, 'Unverified'],
        [true, false, false, 'Unverified'],
        [true, true, false, 'Unverified'],
        [true, false, true, 'Unverified'],
        [true, true, true, 'Verified'],
    ])(
        'can verify evidence record',
        async (
            revisionResult: boolean,
            blockResult: boolean,
            contentResult: boolean,
            expectedResult: string
        ) => {
            // arrange
            when(evidenceRepo.getEvidenceById('1234')).thenResolve(evidenceData);
            when(qldbHelper.verifyRevision(anything())).thenResolve(revisionResult);
            when(qldbHelper.verifyBlock(anything())).thenResolve(blockResult);
            when(evidenceRepo.getEvidenceByIdFromSource('1234')).thenResolve({
                compositeKey: evidenceData.compositeKey,
                evidenceId: evidenceData.evidenceId,
                providerId: evidenceData.providerId,
                contentHash: evidenceData.contentHash,
                contentLocation: evidenceData.contentLocation,
                createdTimestamp: evidenceData.createdTimestamp,
                inputHash: evidenceData.inputHash,
                targetId: evidenceData.targetId,
                schemaId: evidenceData.schemaId,
                providerName: evidenceData.providerName,
            });
            when(
                evidenceContentRepo.getEvidenceContent(anything(), anything())
            ).thenResolve(JSON.stringify({ succeed: contentResult }));

            // act
            const result = await service.verifyEvidence('1234');

            // assert
            expect(result.verificationStatus).toBe(expectedResult);
            if (expectedResult === 'Verified') {
                expect(result.evidence).toBeDefined();
            }
        }
    );

    test('can verify evidence revision', async () => {
        // arrange
        when(evidenceRepo.getEvidenceRevision('1234', '1')).thenResolve(evidenceData);
        when(qldbHelper.verifyRevision(anything())).thenResolve(true);
        when(qldbHelper.verifyBlock(anything())).thenResolve(true);
        when(evidenceRepo.getEvidenceByDocumentId('id', '1')).thenResolve({
            compositeKey: evidenceData.compositeKey,
            evidenceId: evidenceData.evidenceId,
            providerId: evidenceData.providerId,
            contentHash: evidenceData.contentHash,
            contentLocation: evidenceData.contentLocation,
            createdTimestamp: evidenceData.createdTimestamp,
            inputHash: evidenceData.inputHash,
            targetId: evidenceData.targetId,
            schemaId: evidenceData.schemaId,
            providerName: evidenceData.providerName,
        });
        when(evidenceContentRepo.getEvidenceContent(anything(), anything())).thenResolve(
            JSON.stringify({ succeed: true })
        );

        // act
        const result = await service.verifyEvidence('1234', '1');

        // assert
        expect(result.verificationStatus).toBe('Verified');
    });

    test('can verify evidence with attachments', async () => {
        // arrange
        when(evidenceRepo.getEvidenceById('1234')).thenResolve({
            ...evidenceData,
            attachments: [
                {
                    bucketName: 'test',
                    hash: 'Kzs_hqA71z68uU_VoGtl70zlqL_uTIX3UtPh76XYciA',
                    objectKey: 'key',
                },
            ],
        });
        when(qldbHelper.verifyRevision(anything())).thenResolve(true);
        when(qldbHelper.verifyBlock(anything())).thenResolve(true);
        when(evidenceRepo.getEvidenceByIdFromSource('1234')).thenResolve({
            compositeKey: evidenceData.compositeKey,
            evidenceId: evidenceData.evidenceId,
            providerId: evidenceData.providerId,
            contentHash: evidenceData.contentHash,
            contentLocation: evidenceData.contentLocation,
            createdTimestamp: evidenceData.createdTimestamp,
            inputHash: evidenceData.inputHash,
            targetId: evidenceData.targetId,
            schemaId: evidenceData.schemaId,
            attachments: [
                {
                    bucketName: 'test',
                    hash: 'Kzs_hqA71z68uU_VoGtl70zlqL_uTIX3UtPh76XYciA',
                    objectKey: 'key',
                },
            ],
            providerName: evidenceData.providerName,
        });
        when(evidenceContentRepo.getEvidenceContent(anything(), anything())).thenResolve(
            JSON.stringify({ succeed: true })
        );

        // act
        const result = await service.verifyEvidence('1234');

        // assert
        expect(result.verificationStatus).toBe('Verified');
        expect(result.evidence).toBeDefined();
    });
});

describe('get evidence revisions tests', () => {
    test('can get evidence revisions', async () => {
        // arrange
        when(evidenceRepo.getEvidenceRevisions('1234', 10, 0)).thenResolve({
            pageSize: 10,
            records: [{ ...evidenceData }],
            startIndex: 0,
            total: 1,
        });

        // act
        const evidences = await service.getEvidenceRevisions('1234');

        // assert
        expect(evidences.results.length).toBe(1);
        expect(evidences.total).toBe(1);
        expect(evidences.results[0].version).toBe(123);
        expect(evidences.nextToken).toBeUndefined();
    });

    test('include next token if there is more revisions', async () => {
        // arrange
        when(evidenceRepo.getEvidenceRevisions('1234', 1, 0)).thenResolve({
            pageSize: 1,
            records: [evidenceData],
            startIndex: 0,
            total: 2,
        });

        // act
        const evidences = await service.getEvidenceRevisions(
            '1234',
            generatePaginationToken(1, 0)
        );

        // assert
        expect(evidences.results.length).toBe(1);
        expect(evidences.total).toBe(2);
        expect(evidences.results[0].version).toBe(123);
        expect(evidences.nextToken).not.toBeUndefined();
    });
});

function generateEvidenceRecord(): ElasticSearchEvidenceData {
    return {
        compositeKey: 'composite-key',
        evidenceId: 'evidenceId',
        providerId: 'providerId',
        content: { test: 'value' },
        contentString: JSON.stringify({ test: 'value' }),
        contentHash: '1234',
        contentLocation: 'location',
        createdTimestamp: new Date().toISOString(),
        inputHash: 'input',
        targetId: 'target1',
        schemaId: 'schema-id',
        revisionDetails: {
            digest: { digest: '1234' },
            metadata: { id: 'id', version: 123, txTime: 'any', txId: 'string' },
            blockAddress: { sequenceNo: 123, strandId: 'strandId' },
            hash: 'revision-hash',
        },
        providerName: evidenceData.providerName,
    };
}
