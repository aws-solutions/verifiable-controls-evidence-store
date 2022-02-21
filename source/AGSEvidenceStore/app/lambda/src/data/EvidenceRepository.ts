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
import { inject, injectable } from 'tsyringe';
import { QldbDriver, Result } from 'amazon-qldb-driver-nodejs';
import { EvidenceData } from './schemas/EvidenceData';
import * as es from '@elastic/elasticsearch';
import { ElasticSearchResponse } from './schemas/ElasticSearchResponse';
import AGSError from 'src/common/AGSError';
import { ElasticSearchEvidenceData } from './schemas/EvidenceDataWithContent';
import { QueryResult } from './schemas/QueryResult';
import { parseElasticSearchError } from './ElasticSearchErrorParser';
import { Logger, LoggerFactory } from '@apjsb-serverless-lib/logger';
import { buildEvidenceSearchQuery } from './DslQueryBuilder';

@injectable()
export class EvidenceRepository {
    private readonly logger: Logger;
    constructor(
        @inject('QldbDriver') private db: QldbDriver,
        @inject('ElasticSearchClient') private esClient: es.Client,
        @inject('DslClient') private dslClient: es.Client,
        @inject('LoggerFactory')
        loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.getLogger('EvidenceRepository');
    }

    async createEvidence(data: EvidenceData): Promise<void> {
        const statement = 'INSERT INTO evidences ?';

        // qldb doesn't like it when there are undefined or nullable fields in the object
        const cleanedUpData = JSON.parse(JSON.stringify(data));

        const result: Result = await this.db.executeLambda((txn) =>
            txn.execute(statement, cleanedUpData)
        );

        this.logger.info(`Inserted ${result.getResultList().length} records into qldb`);
    }

    async getEvidenceByHashValue(
        hash: string
    ): Promise<ElasticSearchEvidenceData[] | undefined> {
        const statement = `SELECT * FROM evidences a where a.inputHash = '${hash}'`;

        try {
            const result = await this.esClient.sql.query({
                body: { query: statement },
                format: 'json',
            });

            if (!result.statusCode || result.statusCode > 299) {
                throw new AGSError(
                    `Failed to retrieve evidence with input hash ${hash} - received response ${JSON.stringify(
                        result
                    )}`,
                    500,
                    result.statusCode != null && result.statusCode >= 500
                );
            }

            const body = result.body as ElasticSearchResponse<ElasticSearchEvidenceData>;

            if (!body || body.hits.total.value <= 0) {
                return [];
            }

            return body.hits.hits.map((h) => h._source);
        } catch (error) {
            const esError = parseElasticSearchError(error);
            if (esError && esError.type === 'IndexNotFoundException') {
                return undefined;
            }
            throw error;
        }
    }

    async getEvidenceById(evidenceId: string): Promise<ElasticSearchEvidenceData | null> {
        /* eslint-disable */
        const statement = `SELECT * FROM evidences WHERE evidenceId = '${evidenceId}'`;

        const result = await this.esClient.sql.query({
            body: { query: statement },
            format: 'json',
        });

        if (!result.statusCode || result.statusCode > 299) {
            throw new AGSError(
                `Failed to retrieve evidence with id ${evidenceId} - received response ${JSON.stringify(
                    result
                )}`,
                500,
                result.statusCode != null && result.statusCode >= 500
            );
        }

        const body = result.body as ElasticSearchResponse<ElasticSearchEvidenceData>;

        if (!body || body.hits.total.value <= 0) {
            return null;
        }

        return body.hits.hits[0]._source;
    }

    async getEvidenceByIdFromSource(evidenceId: string): Promise<EvidenceData | null> {
        /* eslint-disable */
        const statement = `SELECT * FROM evidences WHERE evidenceId = '${evidenceId}'`;

        const result: Result = await this.db.executeLambda((txn) =>
            txn.execute(statement)
        );

        const dataRecords = result.getResultList();

        if (dataRecords.length != 1) {
            return null;
        }

        return JSON.parse(JSON.stringify(dataRecords[0]));
    }

    async getEvidenceByDocumentId(
        documentId: string,
        revisionId: string
    ): Promise<EvidenceData | null> {
        const statement = `SELECT * FROM history (evidences) as h WHERE h.metadata.id = '${documentId}' AND h.metadata.version = ${revisionId}`;

        const result: Result = await this.db.executeLambda((txn) =>
            txn.execute(statement)
        );

        const dataRecords = result.getResultList();

        this.logger.debug(`Got revision `, { dataRecords, statement });

        if (dataRecords.length != 1) {
            return null;
        }

        return JSON.parse(JSON.stringify(dataRecords[0].get('data')));
    }

    async getEvidences(
        limit: number,
        startIndex: number,
        targetIds?: string[],
        providerId?: string,
        providerIds?: string[],
        schemaId?: string,
        content?: string,
        fromTimestamp?: string,
        toTimestamp?: string
    ): Promise<QueryResult<ElasticSearchEvidenceData>> {
        const query = buildEvidenceSearchQuery(
            limit,
            startIndex,
            targetIds,
            providerId,
            providerIds,
            schemaId,
            content,
            fromTimestamp,
            toTimestamp
        );

        this.logger.debug(`Executing search query ${JSON.stringify(query)}`);
        const result = await this.dslClient.search({ index: 'evidences', body: query });

        if (!result.statusCode || result.statusCode > 299) {
            throw new AGSError(
                `Failed to execute query ${JSON.stringify(
                    query
                )} - received response ${JSON.stringify(result)}`,
                500,
                result.statusCode != null && result.statusCode >= 500
            );
        }

        const body = result.body as ElasticSearchResponse<ElasticSearchEvidenceData>;

        if (!body) {
            return {
                records: [],
                startIndex: startIndex,
                total: 0,
                pageSize: limit,
            };
        }

        return {
            records: body.hits.hits.map((h) => h._source),
            startIndex: startIndex,
            total: body.hits.total.value,
            pageSize: limit,
        };
    }

    async getEvidenceByCompositeKey(
        evidence: EvidenceData
    ): Promise<ElasticSearchEvidenceData | null> {
        let statement = `SELECT * FROM evidences WHERE compositeKey = '${evidence.compositeKey}'`;

        try {
            const result = await this.esClient.sql.query({
                body: { query: statement },
                format: 'json',
            });

            if (!result.statusCode || result.statusCode > 299) {
                throw new AGSError(
                    `Failed to retrieve evidence with providerId ${
                        evidence.providerId
                    }, schemaId ${evidence.schemaId}, targetId ${
                        evidence.targetId
                    } and additionalTargetIds ${evidence.additionalTargetIds?.join(
                        ' - '
                    )}- received ${JSON.stringify(result)}`,
                    500,
                    result.statusCode != null && result.statusCode >= 500
                );
            }

            const body = result.body as ElasticSearchResponse<ElasticSearchEvidenceData>;

            if (!body || body.hits.total.value <= 0) {
                return null;
            }

            return body.hits.hits[0]._source;
        } catch (error) {
            const esError = parseElasticSearchError(error);
            if (
                esError &&
                (esError.type === 'IndexNotFoundException' ||
                    esError.type === 'SemanticAnalysisException')
            ) {
                return null;
            }
            throw error;
        }
    }

    async updateEvidence(evidenceData: EvidenceData): Promise<void> {
        let statement =
            'UPDATE evidences SET inputHash = ?, contentHash = ?, contentLocation = ?, createdTimestamp = ?';

        statement += evidenceData.metadata ? ', metadata = ?' : ', metadata = NULL';

        statement += evidenceData.attachments
            ? ', attachments = ?'
            : ', attachments = NULL';

        statement += ` WHERE evidenceId = '${evidenceData.evidenceId}'`;

        const parameters: any[] = [
            evidenceData.inputHash,
            evidenceData.contentHash,
            evidenceData.contentLocation,
            evidenceData.createdTimestamp,
        ];

        if (evidenceData.metadata) {
            parameters.push(evidenceData.metadata);
        }

        if (evidenceData.attachments) {
            parameters.push(evidenceData.attachments);
        }

        const result: Result = await this.db.executeLambda((txn) => {
            this.logger.debug(`Executing statement ${statement}`);
            return txn.execute(statement, ...parameters);
        });

        this.logger.debug('QLDB result', { qldbResult: result });

        this.logger.info(`Updated ${result.getResultList().length} records in qldb`);
    }

    async getEvidenceRevisions(
        evidenceId: string,
        limit: number,
        startIndex: number
    ): Promise<QueryResult<ElasticSearchEvidenceData>> {
        let statement = `SELECT * FROM evidence_history WHERE evidenceId = '${evidenceId}' ORDER BY revisionDetails.metadata.version LIMIT ${startIndex}, ${limit}`;

        const result = await this.esClient.sql.query({
            body: { query: statement },
            format: 'json',
        });

        if (!result.statusCode || result.statusCode > 299) {
            throw new AGSError(
                `Failed to execute query ${statement} - received response ${JSON.stringify(
                    result
                )}`,
                500,
                result.statusCode != null && result.statusCode >= 500
            );
        }

        const body = result.body as ElasticSearchResponse<ElasticSearchEvidenceData>;

        if (!body) {
            return { records: [], total: 0, startIndex: startIndex, pageSize: limit };
        }

        return {
            records: body.hits.hits.map((x) => x._source),
            pageSize: limit,
            startIndex: startIndex,
            total: body.hits.total.value,
        };
    }

    async getEvidenceRevision(
        evidenceId: string,
        revisionId: string
    ): Promise<ElasticSearchEvidenceData | null> {
        const statement = `SELECT * FROM evidence_history WHERE evidenceId = '${evidenceId}' AND revisionDetails.metadata.version = ${revisionId}`;

        const result = await this.esClient.sql.query({
            body: { query: statement },
            format: 'json',
        });

        if (!result.statusCode || result.statusCode > 299) {
            throw new AGSError(
                `Failed to retrieve revision with id ${revisionId} for evidence with id ${evidenceId} - received response ${JSON.stringify(
                    result
                )}`,
                500,
                result.statusCode != null && result.statusCode >= 500
            );
        }

        const body = result.body as ElasticSearchResponse<ElasticSearchEvidenceData>;

        if (!body || body.hits.total.value <= 0) {
            return null;
        }

        return body.hits.hits[0]._source;
    }
}
