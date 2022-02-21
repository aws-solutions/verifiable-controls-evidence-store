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

import * as elasticSearch from '@elastic/elasticsearch';
import { Context, KinesisStreamEvent } from 'aws-lambda';
import { anyString, anything, instance, mock, reset, when } from 'ts-mockito';

import { EvidenceContentRepository } from 'src/data/EvidenceContentRepository';
import { EvidenceData } from 'src/data/schemas/EvidenceData';
import { EvidenceElasticSearchDomain } from 'src/data/EvidenceElasticSearchDomain';
import { KinesisStreamHandler } from 'evidences-stream-processor/handlers/KinesisStreamHandler';
import { StreamHelper } from 'evidences-stream-processor/StreamHelper';
import { CloudWatchClient } from 'evidences-stream-processor/CloudWatchClient';
import { QldbHelper } from 'src/data/QldbHelper';

describe('KinesisStreamHandler tests', () => {
    beforeEach(() => {
        reset();
        jest.resetAllMocks();
    });

    const helper = mock(StreamHelper);
    const es = new EvidenceElasticSearchDomain(
        new elasticSearch.Client({ node: 'http://localhost' })
    );
    const cw = mock(CloudWatchClient);

    const contentRepo = mock(EvidenceContentRepository);
    const qldbHelper = mock(QldbHelper);
    EvidenceElasticSearchDomain.prototype.indexEvidences = jest.fn();

    const handler = new KinesisStreamHandler(
        instance(helper),
        es,
        instance(contentRepo),
        instance(cw),
        instance(qldbHelper)
    );

    test('do nothing if no revision record found in stream', async () => {
        // arrange
        when(helper.deaggregateRecord(anything())).thenResolve(
            new Array(1).fill(
                new Array(1).fill({
                    partitionKey: '123',
                    sequenceNumber: '123',
                    subSequenceNumber: 123,
                    data: 'my data',
                })
            )
        );
        when(helper.filterRecords<EvidenceData>(anything(), 'evidences')).thenReturn([]);

        // act
        await handler.handle({ Records: [] } as KinesisStreamEvent, {} as Context);

        // assert
        expect(
            EvidenceElasticSearchDomain.prototype.indexEvidences
        ).not.toHaveBeenCalled();
    });

    test('write revision details records into elastic search', async () => {
        // arrange
        when(qldbHelper.getDigest()).thenResolve({
            digest: 'somedigest',
            digestTipAddress: { sequenceNo: 123, strandId: '12345667' },
        });
        when(helper.deaggregateRecord(anything())).thenResolve(
            new Array(1).fill(
                new Array(1).fill({
                    partitionKey: '123',
                    sequenceNumber: '123',
                    subSequenceNumber: 123,
                    data: 'my data',
                })
            )
        );
        when(helper.filterRecords<EvidenceData>(anything(), 'evidences')).thenReturn([
            {
                qldbStreamArn: 'arn',
                recordType: 'REVISION_DETAILS',
                payload: {
                    tableInfo: {
                        tableName: 'evidences',
                        tableId: '1234',
                    },
                    revision: {
                        blockAddress: {
                            strandId: 'strandId',
                            sequenceNo: 123,
                        },
                        hash: 'hash',
                        data: {
                            compositeKey: 'composite-key',
                            evidenceId: '1234',
                            providerId: 'providerId',
                            targetId: '1234',
                            createdTimestamp: '1234',
                            contentHash: 'Kzs/hqA71z68uU/VoGtl70zlqL/uTIX3UtPh76XYciA=',
                            contentLocation:
                                'https://mybucket.s3.amazonaws.com/evidence/content',
                            inputHash: 'input',
                            schemaId: 'schemaId',
                            providerName: 'name',
                        },
                        metadata: {
                            id: 'id',
                            version: 123,
                            txTime: 'any',
                            txId: 'string',
                        },
                    },
                },
            },
        ]);
        when(contentRepo.getEvidenceContent(anyString(), anyString())).thenResolve(
            JSON.stringify({ succeed: true })
        );

        // act
        await handler.handle({ Records: [] } as KinesisStreamEvent, {} as Context);

        // assert
        expect(EvidenceElasticSearchDomain.prototype.indexEvidences).toHaveBeenCalled();
    });
});

const ACCEPTED_SERVICE_PREFIXES = [
    '^arn:aws:macie',
    '^arn:aws:guardduty',
    '^arn:aws:detective',
    '^arn:aws:fms',
    '^arn:aws:fms',
];

const text = ['test', 'test2'];

text.filter((x) => {
    const matchResults = ACCEPTED_SERVICE_PREFIXES.map((s) => {
        return x.match(s) != null;
    });

    return matchResults.includes(true);
});
