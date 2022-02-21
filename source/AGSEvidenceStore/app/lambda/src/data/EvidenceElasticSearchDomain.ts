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
import * as es from '@elastic/elasticsearch';
import { BulkHelper, BulkStats } from '@elastic/elasticsearch/lib/Helpers';
import { computeHash } from 'src/services/CryptoHelper';

import { ElasticSearchEvidenceData } from './schemas/EvidenceDataWithContent';

export class EvidenceElasticSearchDomain {
    constructor(private client: es.Client) {}

    async indexEvidences(evidences: ElasticSearchEvidenceData[]): Promise<void> {
        const tasks: BulkHelper<BulkStats>[] = [];

        tasks.push(this.indexDocuments(evidences, 'evidences', (doc) => doc.evidenceId));

        tasks.push(
            this.indexDocuments(evidences, 'evidence_history', (doc) =>
                computeHash(
                    `${doc.evidenceId}.${doc.revisionDetails.metadata.version}`,
                    'base64url'
                )
            )
        );

        const result = await Promise.all(tasks);

        result.forEach((r) => {
            console.info('ElasticSearch index result, ', r);
            console.info(`Successfully indexed ${r.successful} of ${r.total}`);
        });
    }

    private indexDocuments(
        batch: ElasticSearchEvidenceData[],
        indexName: string,
        docIdFactory: (doc: ElasticSearchEvidenceData) => string
    ): BulkHelper<BulkStats> {
        return this.client.helpers.bulk({
            datasource: batch,
            onDocument(item) {
                return { index: { _index: indexName, _id: docIdFactory(item) } };
            },
            error_trace: true,
            retries: 5,
            onDrop: (item) => {
                console.error('Failed to index ', item);
            },
        });
    }
}
