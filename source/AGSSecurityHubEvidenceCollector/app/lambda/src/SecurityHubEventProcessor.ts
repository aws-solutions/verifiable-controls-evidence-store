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
import { Message, Evidence } from './common/Types';
import { EvidenceProducer } from './EvidenceProducer';
import { ResourceDetail, SecurityHubFinding } from './SecurityHubEvent';
import { getResourcesTags } from './clients/TagClient';
import { filterFindingsWithAcceptedSuffixes } from './SecurityHubFindingHelper';

export class SecurityHubEventProcessor
    extends EvidenceProducer
    implements SQSEventProcessor
{
    private static _instance: SecurityHubEventProcessor | undefined;

    public static getInstance(): SecurityHubEventProcessor {
        if (!SecurityHubEventProcessor._instance) {
            SecurityHubEventProcessor._instance = new SecurityHubEventProcessor();
        }
        return SecurityHubEventProcessor._instance;
    }

    public async processEvent(message: Message): Promise<void> {
        let findingSourceProductArns: string[] = [];
        try {
            findingSourceProductArns =
                await this.ssmParameterClient.getStringListParameterValue(
                    process.env.FINDING_SOURCE_PRODUCT_ARNS_SSM || ''
                );
        } catch (e) {
            console.error('Could not retrieve list of accepted sources', e);
            throw e;
        }

        const matchedFindings = filterFindingsWithAcceptedSuffixes(
            message,
            findingSourceProductArns
        );

        if (matchedFindings.length == 0) {
            // no matched findings, do nothing
            console.info('The event contains no findings from accepted sources.');
            return;
        }

        const enrichedFindings = await Promise.all(
            matchedFindings.map((x: SecurityHubFinding) => getResourcesTags(x))
        );

        try {
            const tasks = enrichedFindings.map(async (x) => {
                const findingObjectKey = await this.storeOriginalFindingsInS3(
                    x,
                    x.Id,
                    x.ProductArn
                );
                const evidences = this.prepareEvidence(x, findingObjectKey);
                return this.saveEvidence(evidences);
            });

            const results = (await Promise.all(tasks)).flatMap((x) => x);

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
                `Invalid message received. Error: ${e.message}, Message:${message}`
            );
            throw new Error(`Invalid message received. Error: ${e.message}`);
        }
    }

    private prepareEvidence(
        finding: SecurityHubFinding,
        findingS3ObjectKey: string
    ): Evidence[] {
        // create 1 evidence per resource recorded in the finding
        const evidences = finding.Resources.map((x: ResourceDetail) => {
            const agsContext = this.constructAgsContext(x.Tags || {});

            const additionalTargetIds: string[] = [];

            if (x.Tags) {
                console.debug(`${x.Id} has the following tags `, x.Tags);
                for (const key in x.Tags) {
                    if (key.startsWith('AGS')) {
                        additionalTargetIds.push(x.Tags[key]!);
                    }
                }
            }

            // record product arn and types
            additionalTargetIds.push(finding.ProductArn);
            finding.Types.forEach((t: string) => additionalTargetIds.push(t));

            const evidence: Evidence = {
                providerId: process.env.EVIDENCE_PROVIDER_ID!,
                schemaId: process.env.EVIDENCE_SCHEMA_ID!,
                targetId: x.Id,
                additionalTargetIds:
                    additionalTargetIds.length > 0 ? additionalTargetIds : undefined,
                content: {
                    severity: finding.Severity.Label,
                    findingId: finding.Id,
                    findingProduct: finding.ProductName ?? finding.ProductArn,
                    summary: finding.Title,
                    createdAt: finding.CreatedAt,
                    updatedAt: finding.UpdatedAt,
                    status: finding.Workflow?.Status,
                    accountId: finding.AwsAccountId,
                    region: finding.Region,
                    remediationRecommendation: finding.Remediation?.Recommendation
                        ? {
                              text: finding.Remediation.Recommendation.Text,
                              url: finding.Remediation.Recommendation.Url,
                          }
                        : undefined,
                    agsContext,
                    source: finding.ProductArn,
                },
                attachments: [{ objectKey: findingS3ObjectKey }],
            };

            console.log(`Constructed evidence ${JSON.stringify(evidence)}`);

            return evidence;
        });

        return evidences.filter((x) => x !== undefined);
    }
}
