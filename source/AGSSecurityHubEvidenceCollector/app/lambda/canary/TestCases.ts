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
import * as AWS from 'aws-sdk';

import { FullEvidenceOutput, SearchEvidenceResponse } from '../src/common/Types';
import { callback, createRequest, log, testApi } from './canaryUtils';

import { v4 as uuid } from 'uuid';

const sqs = new AWS.SQS({ region: process.env.AWS_REGION, apiVersion: '2012-11-05' });

export class TestCases {
    constructor(private hostname: string, private stageName: string) {}

    evidencesContainTargetIds(
        evidences: FullEvidenceOutput[] | undefined,
        targetIds: string[]
    ): void {
        if (!evidences) {
            throw new Error(`No evidences found for ${targetIds.join(', ')}`);
        }
        const actualTargetIds = evidences?.map((x) => x.targetId);
        const isTargetIdsEqual = actualTargetIds.every((x) => targetIds.includes(x));

        if (!isTargetIdsEqual) {
            throw new Error(`No evidences found for ${targetIds.join(', ')}`);
        }
    }

    async searchEvidence(targetIds: string[]): Promise<FullEvidenceOutput[] | undefined> {
        const request = createRequest(
            'POST',
            this.hostname,
            `/${this.stageName}/evidences/search/`,
            { targetIds: targetIds }
        );

        let response: SearchEvidenceResponse | undefined;
        await testApi('Search Evidence By Target Id', request, async (res: any) => {
            response = await callback(res, 200);
        });

        return response?.results ?? [];
    }

    async generateSQSFinding(queueUrl: string, resourceArns: string[]): Promise<void> {
        const sourceAccount = '111122223333';

        const resources = resourceArns.map((x: string) => {
            return {
                Partition: 'aws',
                Type: 'S3Bucket',
                Region: 'CustomResource',
                Id: x,
                Tags: {
                    AGSReleaseId: '1234',
                    AGSEnvName: 'dev',
                    AGSEnvId: 'env-1234',
                    AGSAppName: 'test-app',
                },
            };
        });

        const findingId = uuid();
        const messageObj = {
            version: '0',
            id: 'c3b0cd08-5b39-3df9-1340-6b558b8a6ded',
            'detail-type': 'Security Hub Findings - Imported',
            source: 'aws.securityhub',
            account: sourceAccount,
            time: '2021-09-16T07:37:08Z',
            region: 'ap-southeast-2',
            resources: [
                `arn:aws:securityhub:ap-southeast-2:${sourceAccount}:action/custom/findings`,
            ],
            detail: {
                actionName: 'FindingsEventBridge',
                actionDescription: 'FindingsEventBridge',
                findings: [
                    {
                        ProductArn: 'arn:aws:macie:ap-southeast-2::product/aws/macie',
                        Types: [
                            'Software and Configuration Checks/Industry and Regulatory Standards/PCI-DSS',
                        ],
                        Description:
                            'This AWS control checks whether AWS Config is enabled in current account and region.',
                        Compliance: {
                            Status: 'FAILED',
                            RelatedRequirements: ['PCI DSS 10.5.2', 'PCI DSS 11.5'],
                        },
                        ProductName: 'Security Hub',
                        FirstObservedAt: '2021-08-18T06:14:45.654Z',
                        CreatedAt: '2021-08-18T06:14:45.654Z',
                        LastObservedAt: '2021-09-16T06:30:22.985Z',
                        CompanyName: 'AWS',
                        FindingProviderFields: {
                            Types: [
                                'Software and Configuration Checks/Industry and Regulatory Standards/PCI-DSS',
                            ],
                            Severity: {
                                Normalized: 40,
                                Label: 'MEDIUM',
                                Product: 40,
                                Original: 'MEDIUM',
                            },
                        },
                        ProductFields: {
                            StandardsArn:
                                'arn:aws:securityhub:::standards/pci-dss/v/3.2.1',
                            StandardsSubscriptionArn: `arn:aws:securityhub:ap-southeast-2:${sourceAccount}:subscription/pci-dss/v/3.2.1`,
                            ControlId: 'PCI.Config.1',
                            RecommendationUrl:
                                'https://docs.aws.amazon.com/console/securityhub/PCI.Config.1/remediation',
                            StandardsControlArn: `arn:aws:securityhub:ap-southeast-2:${sourceAccount}:control/pci-dss/v/3.2.1/PCI.Config.1`,
                            'aws/securityhub/ProductName': 'Security Hub',
                            'aws/securityhub/CompanyName': 'AWS',
                            'Resources:0/Id': `arn:aws:iam::${sourceAccount}:root`,
                            'aws/securityhub/FindingId': findingId,
                        },
                        Remediation: {
                            Recommendation: {
                                Text: 'For directions on how to fix this issue, consult the AWS Security Hub PCI DSS documentation.',
                                Url: 'https://docs.aws.amazon.com/console/securityhub/PCI.Config.1/remediation',
                            },
                        },
                        SchemaVersion: '2018-10-08',
                        GeneratorId: 'pci-dss/v/3.2.1/PCI.Config.1',
                        RecordState: 'ACTIVE',
                        Title: 'PCI.Config.1 AWS Config should be enabled',
                        Workflow: {
                            Status: 'NEW',
                        },
                        Severity: {
                            Normalized: 40,
                            Label: 'MEDIUM',
                            Product: 40,
                            Original: 'MEDIUM',
                        },
                        UpdatedAt: '2021-09-16T06:30:18.195Z',
                        WorkflowState: 'NEW',
                        AwsAccountId: sourceAccount,
                        Region: 'ap-southeast-2',
                        Id: `arn:aws:securityhub:ap-southeast-2:${sourceAccount}:subscription/finding/${findingId}`,
                        Resources: resources,
                    },
                ],
            },
        };
        log(JSON.stringify(messageObj));
        log('Sending message to ' + queueUrl);
        await sqs
            .sendMessage({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(messageObj),
                MessageGroupId: 'sechub-finding',
            })
            .promise();
    }
}
