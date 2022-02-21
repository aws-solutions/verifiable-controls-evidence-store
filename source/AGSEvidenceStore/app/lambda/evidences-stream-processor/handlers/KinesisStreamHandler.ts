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

import { StreamHelper } from 'evidences-stream-processor/StreamHelper';
import * as lambda from 'aws-lambda';
import { BasicHttpResponse } from '@apjsb-serverless-lib/common-types';
import { AsyncHandlerObj } from '@apjsb-serverless-lib/middleware-chain';
import { inject, injectable } from 'tsyringe';
import { EvidenceData } from 'src/data/schemas/EvidenceData';
import { EvidenceElasticSearchDomain } from 'src/data/EvidenceElasticSearchDomain';
import { EvidenceContentRepository } from 'src/data/EvidenceContentRepository';
import { parseObjectUrl } from 'src/services/S3UrlHelper';
import {
    ElasticSearchEvidenceData,
    LedgerDigest,
} from 'src/data/schemas/EvidenceDataWithContent';
import { computeHash } from 'src/services/CryptoHelper';
import AGSError from 'src/common/AGSError';
import { CloudWatchClient } from 'evidences-stream-processor/CloudWatchClient';
import { QldbHelper } from 'src/data/QldbHelper';
import { RevisionDetailsRecord } from 'evidences-stream-processor/types/RevisionDetailsRecord';

const batchSize = 30;
@injectable()
export class KinesisStreamHandler
    implements AsyncHandlerObj<lambda.KinesisStreamEvent, BasicHttpResponse>
{
    constructor(
        @inject('StreamHelper') private helper: StreamHelper,
        @inject('EvidenceElasticSearchDomain')
        private es: EvidenceElasticSearchDomain,
        @inject('EvidenceContentRepository')
        private evidenceContent: EvidenceContentRepository,
        @inject('CloudWatchClient')
        private cloudWatch: CloudWatchClient,
        @inject('QldbHelper') private qldbHelper: QldbHelper
    ) {}

    async handle(
        event: lambda.KinesisStreamEvent,
        _context: lambda.Context
    ): Promise<BasicHttpResponse> {
        console.debug('Deaggregating kinesis record');
        // de-aggregate kinesis records into meaningful user records
        const userRecords = (
            await Promise.all(
                event.Records.map((it) => this.helper.deaggregateRecord(it))
            )
        ).flat();

        console.debug('Decoding user records and filtering REVISION_DETAILS records');
        // decode the user records, transforming them from base64 ion encoded messages into json objects
        // select only the REVISION_DETAILS evidence records
        const revisionDetailsRecords = this.helper.filterRecords<EvidenceData>(
            userRecords,
            'evidences'
        );

        if (revisionDetailsRecords.length > 0) {
            console.debug(
                `Kinesis record contains ${revisionDetailsRecords.length} REVISION_DETAILS records`
            );

            // get current qldb digest
            console.debug('Getting QLDB digest');
            const digest = await this.qldbHelper.getDigest();

            let batches: RevisionDetailsRecord<EvidenceData>[][] = [];

            if (revisionDetailsRecords.length > batchSize) {
                batches = new Array(Math.ceil(revisionDetailsRecords.length / batchSize))
                    .fill({})
                    .map(() => revisionDetailsRecords.splice(0, batchSize));
            } else {
                batches = new Array(1).fill(revisionDetailsRecords);
            }

            console.debug(`Deviding the records into ${batches.length} for processing`);

            await Promise.all(
                batches.map(async (batch) => {
                    const evidences = await Promise.all(
                        batch.map((record) => this.getEvidenceContent(record, digest))
                    );
                    return this.es.indexEvidences(evidences);
                })
            );

            // calculate the amount of time taken to replicate data across to elasticsearch, from the moment data is committed into qldb
            const averageCreatedTime =
                revisionDetailsRecords
                    .map((x) => new Date(x.payload.revision.metadata.txTime).getTime())
                    .reduce((a, b) => a + b) / revisionDetailsRecords.length;

            const indexedDelay = new Date().getTime() - averageCreatedTime;

            console.debug('Uploading metric data');
            await this.cloudWatch.putReplicationDelayMetricData(indexedDelay);
        }

        return BasicHttpResponse.ofObject(200, {});
    }

    private async getEvidenceContent(
        evidenceRecord: RevisionDetailsRecord<EvidenceData>,
        digest: LedgerDigest
    ): Promise<ElasticSearchEvidenceData> {
        const evidence = evidenceRecord.payload.revision.data;
        const [bucketName, objectKey] = parseObjectUrl(evidence.contentLocation);

        console.debug(
            `Getting evidence content from bucketName ${bucketName} and with objectKey ${objectKey}`
        );

        const content = await this.evidenceContent.getEvidenceContent(
            bucketName,
            objectKey
        );

        if (
            content != null &&
            evidence.contentHash != computeHash(content) &&
            evidence.contentHash != computeHash(content, 'base64url')
        ) {
            throw new AGSError(
                `Failed to validate the integrity for content of evidence with id ${evidence.evidenceId}, it may have been tampered with.`,
                422
            );
        }

        return {
            ...evidence,
            content: content ? JSON.parse(content) : {},
            contentString: content,
            revisionDetails: {
                digest,
                metadata: evidenceRecord.payload.revision.metadata,
                blockAddress: evidenceRecord.payload.revision.blockAddress,
                hash: evidenceRecord.payload.revision.hash,
            },
        };
    }
}
