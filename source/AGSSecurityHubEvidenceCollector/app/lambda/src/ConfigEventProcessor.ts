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

import { SQSEventProcessor } from './App';
import { Evidence, Message } from './common/Types';
import { getArn } from './clients/ConfigClient';
import { ConfigEventDetail } from './ConfigEvent';
import { EvidenceProducer } from './EvidenceProducer';
import { validate as validateArn } from '@aws-sdk/util-arn-parser';
import { getTags } from './clients/TagClient';

export class ConfigEventProcessor extends EvidenceProducer implements SQSEventProcessor {
    private static _instance: ConfigEventProcessor | undefined;

    private constructor() {
        super();
    }

    public static getInstance(): ConfigEventProcessor {
        if (!ConfigEventProcessor._instance) {
            ConfigEventProcessor._instance = new ConfigEventProcessor();
        }
        return ConfigEventProcessor._instance;
    }

    async processEvent(message: Message): Promise<void> {
        const configEventDetail = message?.detail as unknown as ConfigEventDetail;

        try {
            const evidences = await this.prepareEvidence(configEventDetail);

            if (evidences.length === 0) {
                return;
            }

            const results = await this.saveEvidence(evidences);

            console.info(
                `Successfully created ${results.filter((x) => x).length} evidences.`
            );
            if (results.filter((x) => !x).length > 0) {
                console.info(
                    `Failed to record ${results.filter((x) => !x).length} evidences.`
                );
            }
        } catch (e: any) {
            console.log(
                `Invalid message received. Error: ${e.message}, Message:${JSON.stringify(
                    message
                )}`
            );
            throw new Error(`Invalid message received. Error: ${e.message}`);
        }
    }

    private async prepareEvidence(finding: ConfigEventDetail): Promise<Evidence[]> {
        // get resource arn
        const resourceArn = await getArn(
            finding.resourceId,
            finding.resourceType,
            finding.awsAccountId,
            finding.awsRegion
        );

        if (!validateArn(resourceArn)) {
            // arn ain't valid do nothing
            return [];
        }

        const resourceTagMapping = await getTags(
            [resourceArn],
            finding.awsAccountId,
            finding.awsRegion
        );

        const rawTags = resourceTagMapping
            .flatMap((x) => x.Tags)
            .filter((x) => x !== undefined);

        const tags: { [key: string]: string | undefined } = {};

        rawTags.forEach((x) => {
            if (x !== undefined && x.Key !== undefined) {
                tags[x.Key] = x.Value;
            }
        });

        // valid evidence, let's store the original finding
        const findingObjectKey = await this.storeOriginalFindingsInS3(
            finding,
            finding.resourceId,
            finding.configRuleName
        );

        const evidence: Evidence = {
            providerId: process.env.EVIDENCE_PROVIDER_ID!,
            schemaId: process.env.EVIDENCE_SCHEMA_ID!,
            targetId: resourceArn,
            content: {
                severity: 'CRITICAL',
                findingId: resourceArn,
                findingProduct: 'aws.config',
                summary: finding.messageType,
                createdAt: finding.newEvaluationResult.resultRecordedTime,
                updatedAt: finding.notificationCreationTime,
                status: 'NEW',
                accountId: finding.awsAccountId,
                region: finding.awsRegion,
                agsContext: this.constructAgsContext(tags),
                source: 'aws.config',
            },
            attachments: [{ objectKey: findingObjectKey }],
        };

        console.log(`Constructed evidence ${JSON.stringify(evidence)}`);

        return [evidence];
    }
}
