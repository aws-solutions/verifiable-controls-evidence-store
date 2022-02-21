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
import AGSError from 'src/common/AGSError';
import { EvidenceProviderRepository } from 'src/data/EvidenceProviderRepository';
import { EvidenceContentData } from 'src/data/schemas/EvidenceContentData';
import { EvidenceContentRepository } from 'src/data/EvidenceContentRepository';
import { AttachmentData, EvidenceData } from 'src/data/schemas/EvidenceData';
import { EvidenceRepository } from 'src/data/EvidenceRepository';
import { CreateEvidenceInput } from 'src/types/CreateEvidenceInput';
import {
    FullEvidenceOutput,
    FullEvidenceOutputWithVersion,
} from 'src/types/EvidenceOutput';
import { inject, injectable } from 'tsyringe';
import { v4 as uuid } from 'uuid';
import { GetEvidencesInput } from 'src/types/GetEvidencesInput';
import { generatePaginationToken, parsePaginationToken } from './PaginationTokenHelper';
import { QueryOutput } from 'src/types/QueryOutput';
import { ElasticSearchEvidenceData } from 'src/data/schemas/EvidenceDataWithContent';
import { computeHash } from './CryptoHelper';
import { Logger, LoggerFactory } from '@apjsb-serverless-lib/logger';
import { validateJson } from 'src/validators/JsonSchemaValidator';
import { EvidenceSchemaRepository } from 'src/data/EvidenceSchemaRepository';
import { QldbHelper } from 'src/data/QldbHelper';
import { EvidenceVerificationStatusOutput } from 'src/types/EvidenceVerificationStatusOutput';
import { parseObjectUrl } from './S3UrlHelper';
import * as _ from 'lodash';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
@injectable()
export class EvidenceService {
    private readonly logger: Logger;
    private readonly attachmentBucketName: string;

    constructor(
        @inject(EvidenceRepository)
        private evidenceRepo: EvidenceRepository,
        @inject(EvidenceProviderRepository)
        private providerRepo: EvidenceProviderRepository,
        @inject(EvidenceSchemaRepository)
        private schemaRepo: EvidenceSchemaRepository,
        @inject(EvidenceContentRepository)
        private evidenceContentRepo: EvidenceContentRepository,
        @inject('QldbHelper')
        private qldbHelper: QldbHelper,
        @inject('LoggerFactory') loggerFactory: LoggerFactory,
        @inject('AppConfiguration') appConfig: AppConfiguration
    ) {
        this.logger = loggerFactory.getLogger('EvidenceService');
        this.attachmentBucketName = appConfig.evidenceAttachmentBucketName;
    }

    async createEvidence(
        input: CreateEvidenceInput & { apiKey: string }
    ): Promise<FullEvidenceOutput> {
        this.logger.debug('Validating evidence provider.');
        // check for valid provider
        const provider = await this.providerRepo.getEvidenceProvider(input.providerId);

        if (!provider) {
            throw new AGSError(
                'Could not find evidence provider with the given providerId.',
                400,
                false
            );
        }

        if (!provider.enabled) {
            throw new AGSError(
                `Provider with id ${provider.providerId} is not enabled.`,
                422,
                false
            );
        }

        if (provider.apiKeyHash !== computeHash(input.apiKey)) {
            throw new AGSError(
                `Provider with id ${input.providerId} is not allowed to use the provided api key.`,
                403,
                false
            );
        }
        this.logger.debug('Validating evidence content against schema');
        const schema = await this.schemaRepo.getSchema(
            provider.providerId,
            input.schemaId
        );

        if (!schema) {
            this.logger.debug(
                `Schema with id ${input.schemaId} for ${provider.providerId} not found.`
            );
            throw new AGSError(
                `Could not find Schema with id ${input.schemaId} for authority with id ${provider.providerId}.`,
                400
            );
        }

        validateJson(input.content, schema.content);

        this.logger.debug(`Checking for duplicate evidences.`);
        // ensure we don't commit the same thing multiple times
        const existingEvidenceData = await this.evidenceRepo.getEvidenceByHashValue(
            computeHash(JSON.stringify(input))
        );

        if (existingEvidenceData && existingEvidenceData.length > 0) {
            this.logger.debug('The same evidence already exists, returning it.');
            const evidence =
                existingEvidenceData.pop() || ({} as ElasticSearchEvidenceData);

            return this.mapToEvidenceOutput(evidence);
        }

        let attachmentData: AttachmentData[] | undefined = undefined;

        if (input.attachments && input.attachments.length > 0) {
            this.logger.debug(
                `Computing evidence attachment hashes, there are ${input.attachments.length} attachments`
            );

            attachmentData = await Promise.all(
                input.attachments.map(async (x) => {
                    const attachmentContent =
                        await this.evidenceContentRepo.getEvidenceContent(
                            this.attachmentBucketName,
                            x.objectKey
                        );

                    if (!attachmentContent) {
                        throw new AGSError(
                            `Unable to download attachment with objectKey ${x.objectKey}, the object appears to be empty`,
                            400
                        );
                    }

                    return {
                        objectKey: x.objectKey,
                        bucketName: this.attachmentBucketName,
                        hash: computeHash(attachmentContent, 'base64url'),
                    };
                })
            );
        }

        this.logger.debug('Saving evidence content to S3');
        // persist the content
        const contentHash = computeHash(JSON.stringify(input.content), 'base64url');

        const evidenceContent: EvidenceContentData = {
            evidenceProviderId: input.providerId,
            targetId: input.targetId,
            content: JSON.stringify(input.content),
            contentHash: contentHash,
        };

        const contentLocation = await this.evidenceContentRepo.putContent(
            evidenceContent
        );

        try {
            this.logger.debug('Saving evidence to qldb');

            // persist the evidence
            const evidence: EvidenceData = {
                compositeKey: this.computeCompositeKey(
                    input.providerId,
                    input.targetId,
                    input.schemaId,
                    input.additionalTargetIds?.sort()
                ),
                evidenceId: uuid().toString(),
                providerId: input.providerId,
                contentHash: contentHash,
                contentLocation: contentLocation,
                createdTimestamp: new Date(Date.now()).toISOString(),
                targetId: input.targetId,
                correlationId: input.correlationId,
                inputHash: computeHash(JSON.stringify(input)),
                schemaId: input.schemaId,
                additionalTargetIds: input.additionalTargetIds,
                metadata: input.metadata,
                attachments: attachmentData,
                providerName: provider.name,
            };

            const existingEvidence = await this.evidenceRepo.getEvidenceByCompositeKey(
                evidence
            );

            if (existingEvidence) {
                this.logger.debug(
                    'Found an existing evidence with the same authority, schema, target, additional targets, updating it'
                );
                evidence.evidenceId = existingEvidence.evidenceId;
                evidence.createdTimestamp = new Date().toISOString();
                await this.evidenceRepo.updateEvidence(evidence);
            } else {
                await this.evidenceRepo.createEvidence(evidence);
            }

            return this.mapToEvidenceOutput({
                ...evidence,
                content: input.content,
            });
        } catch (error) {
            this.logger.error(
                'Error occurred when inserting a new evidence into QLDB ',
                error
            );

            // delete s3 object
            this.logger.debug('Deleting the evidence content from S3');
            await this.evidenceContentRepo.deleteContent(evidenceContent);

            throw new AGSError(
                'An error occurred when saving the new evidence',
                500,
                true
            );
        }
    }

    async getEvidenceById(
        evidenceId: string,
        revisionId?: string
    ): Promise<FullEvidenceOutput | undefined> {
        const evidence = revisionId
            ? await this.evidenceRepo.getEvidenceRevision(evidenceId, revisionId)
            : await this.evidenceRepo.getEvidenceById(evidenceId);

        if (!evidence) {
            return undefined;
        }

        return this.mapToEvidenceOutput(evidence);
    }

    async getEvidences(
        input: GetEvidencesInput
    ): Promise<QueryOutput<FullEvidenceOutput>> {
        // parse pagination token
        const [startIndex, limit] = parsePaginationToken(input.nextToken);

        // get values
        const evidences = await this.evidenceRepo.getEvidences(
            input.limit && input.limit <= 20 ? input.limit : limit,
            startIndex,
            input.targetIds,
            input.providerId,
            input.providerIds,
            input.schemaId,
            input.content,
            input.fromTimestamp,
            input.toTimestamp
        );

        return {
            total: evidences.total,
            results: evidences.records.map(this.mapToEvidenceOutput),
            nextToken:
                startIndex + evidences.pageSize < evidences.total
                    ? generatePaginationToken(
                          evidences.pageSize,
                          startIndex + evidences.pageSize
                      )
                    : undefined,
        };
    }

    async getEvidenceRevisions(
        evidenceId: string,
        nextToken?: string,
        limit?: number
    ): Promise<QueryOutput<FullEvidenceOutputWithVersion>> {
        const [startIndex, tokenLimit] = parsePaginationToken(nextToken);

        const revisions = await this.evidenceRepo.getEvidenceRevisions(
            evidenceId,
            limit && limit <= 20 ? limit : tokenLimit,
            startIndex
        );

        return {
            total: revisions.total,
            results: revisions.records.map((x) => {
                return {
                    ...this.mapToEvidenceOutput(x),
                    version: x.revisionDetails.metadata.version,
                };
            }),
            nextToken:
                startIndex + revisions.pageSize < revisions.total
                    ? generatePaginationToken(
                          revisions.pageSize,
                          startIndex + revisions.pageSize
                      )
                    : undefined,
        };
    }

    async verifyEvidence(
        evidenceId: string,
        revisionId?: string
    ): Promise<EvidenceVerificationStatusOutput> {
        // get the evidence
        this.logger.debug(
            `Retrieving the evidence with id ${evidenceId} and revision ${revisionId}`
        );
        const evidence = revisionId
            ? await this.evidenceRepo.getEvidenceRevision(evidenceId, revisionId)
            : await this.evidenceRepo.getEvidenceById(evidenceId);

        if (!evidence) {
            throw new AGSError(`Evidence with id ${evidenceId} not found.`, 404, false);
        }

        const results = await Promise.all([
            this.qldbHelper.verifyBlock(evidence),
            this.qldbHelper.verifyRevision(evidence),
            this.verifyEvidenceContent(evidence, revisionId),
            this.verifyEvidenceAttachments(evidence),
        ]);

        const hasIssue = results.some((x) => !x);

        if (hasIssue) {
            return { verificationStatus: 'Unverified' };
        }

        return {
            verificationStatus: 'Verified',
            evidence: this.mapToEvidenceOutput(evidence),
        };
    }

    private async verifyEvidenceContent(
        evidence: ElasticSearchEvidenceData,
        revisionId?: string
    ): Promise<boolean> {
        this.logger.debug(
            `Verifying data content for evidence with id ${evidence.evidenceId}`
        );
        const evidenceFromSource = revisionId
            ? await this.evidenceRepo.getEvidenceByDocumentId(
                  evidence.revisionDetails.metadata.id,
                  revisionId
              )
            : await this.evidenceRepo.getEvidenceByIdFromSource(evidence.evidenceId);

        if (!evidenceFromSource) {
            this.logger.info(
                `Unable to retrieve evidence with id ${evidence.evidenceId} from QLDB.`
            );
            return false;
        }

        const [bucketName, objectKey] = parseObjectUrl(
            evidenceFromSource.contentLocation
        );
        const evidenceContentFromSource =
            await this.evidenceContentRepo.getEvidenceContent(bucketName, objectKey);

        const fullEvidenceDataFromSource = {
            ...evidenceFromSource,
            content: JSON.parse(evidenceContentFromSource!),
        };

        const fullEvidenceFromReadRepica = _.omit(
            evidence,
            'revisionDetails',
            'contentString'
        );

        this.logger.debug('Evidence from source ', {
            source: fullEvidenceDataFromSource,
        });
        this.logger.debug('Evidence from read replica ', {
            replica: fullEvidenceFromReadRepica,
        });

        const verified = _.isEqual(
            JSON.parse(JSON.stringify(fullEvidenceDataFromSource)),
            JSON.parse(JSON.stringify(fullEvidenceFromReadRepica))
        );

        if (!verified) {
            this.logger.info(
                `Unable to verify content with source of truth for evidence with id ${evidence.evidenceId}.`,
                {
                    source: fullEvidenceDataFromSource,
                    replica: fullEvidenceFromReadRepica,
                }
            );
            return false;
        }

        return true;
    }

    private async verifyEvidenceAttachments(
        evidence: ElasticSearchEvidenceData
    ): Promise<boolean> {
        this.logger.debug(`Validating evidence attachments`);
        if (!evidence.attachments || evidence.attachments.length === 0) {
            this.logger.debug(`Evidence has no attachments, skipping validation`);
            return true;
        }

        const results = await Promise.all(
            evidence.attachments.map(async (x) => {
                const data = await this.evidenceContentRepo.getEvidenceContent(
                    x.bucketName,
                    x.objectKey
                );

                if (!data) {
                    return false;
                }

                const hash = computeHash(data, 'base64url');

                this.logger.debug(
                    `Attachment verification result for ${x.objectKey} is ${
                        hash === x.hash
                    } - stored hash ${x.hash} - computed hash ${hash}`
                );

                return hash === x.hash;
            })
        );

        return results.every((x) => x === true);
    }

    private computeCompositeKey(
        providerId: string,
        targetId: string,
        schemaId: string,
        additionalTargetIds?: string[]
    ): string {
        return computeHash(
            `${providerId}.${targetId}.${schemaId}.${additionalTargetIds?.join('--')}`,
            'base64'
        );
    }

    private mapToEvidenceOutput(
        data: EvidenceData & { content: Record<string, unknown> }
    ): FullEvidenceOutput {
        return {
            evidenceId: data.evidenceId,
            providerId: data.providerId,
            targetId: data.targetId,
            createdTimestamp: new Date(data.createdTimestamp).toISOString(),
            correlationId: data.correlationId,
            content: data.content,
            schemaId: data.schemaId,
            additionalTargetIds: data.additionalTargetIds,
            metadata: data.metadata,
            attachments:
                data.attachments && data.attachments.length > 0
                    ? data.attachments.map((x) => {
                          return {
                              objectKey: x.objectKey,
                              attachmentId: x.hash,
                          };
                      })
                    : undefined,
            providerName: data.providerName,
        };
    }
}
