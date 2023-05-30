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
import * as ags from '@ags-cdk/ags-service-template';
import * as cdk from 'aws-cdk-lib';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';

import { Construct } from 'constructs';
import { EvidenceStoreDatabaseDashboard } from './evidence-store-database-dashboard';

export interface EvidenceStoreDashboardProps {
    serviceName: string;
    apiName: string;
    mainLambdaFunctionName: string;
    streamProcessorFunctionName: string;
    streamProcessorDlqName: string;
    evidenceProviderTableName: string;
    evidenceSchemaTableName: string;
    evidenceLedgerName: string;
    evidenceSearchDomain: string;
    accountNumber: string;
    canaryName: string;
}

export class EvidenceStoreDashboard extends Construct {
    constructor(scope: Construct, id: string, props: EvidenceStoreDashboardProps) {
        super(scope, id);

        const dataDashboard = new EvidenceStoreDatabaseDashboard(
            props.evidenceLedgerName,
            props.evidenceSearchDomain,
            props.accountNumber
        );

        new ags.AgsServiceDashboard(this, 'service-dashboard', {
            dashboardName: 'EvidenceStoreDashboard',
            apiGateway: {
                apiName: props.apiName,
                endpoints: [
                    { method: 'POST', resource: '/evidences' },
                    { method: 'POST', resource: '/evidences/search' },
                    { method: 'GET', resource: '/evidences/{id}' },
                    { method: 'POST', resource: '/providers' },
                    { method: 'GET', resource: '/providers' },
                    { method: 'GET', resource: '/providers/{id}' },
                    { method: 'PUT', resource: '/providers/{id}' },
                    { method: 'POST', resource: '/providers/{id}/schemas' },
                    { method: 'GET', resource: '/providers/{id}/schemas/{schemaId}' },
                    { method: 'GET', resource: '/evidences/{id}/verificationstatus' },
                    { method: 'GET', resource: '/evidences/{id}/revisions' },
                    {
                        method: 'GET',
                        resource: '/evidences/{id}/attachments/{attachmentId}',
                    },
                    {
                        method: 'GET',
                        resource: '/evidences/{id}/revisions/{revisionId}',
                    },
                    {
                        method: 'GET',
                        resource:
                            '/evidences/{id}/revisions/{revisionId}/attachments/{attachmentId}',
                    },
                    {
                        method: 'GET',
                        resource:
                            '/evidences/{id}/revisions/{revisionId}/verificationstatus',
                    },
                ],
            },
            serviceName: props.serviceName,
            lambdas: [
                {
                    functionName: props.mainLambdaFunctionName,
                    friendlyName: 'Main Function',
                },
                {
                    functionName: props.streamProcessorFunctionName,
                    friendlyName: 'Stream Processor',
                },
            ],
            canaryName: props.canaryName,
            dynamoDbTables: [
                {
                    tableName: props.evidenceProviderTableName,
                    friendlyTableName: 'providers',
                },
                {
                    tableName: props.evidenceSchemaTableName,
                    friendlyTableName: 'Schemas',
                },
            ],
            additionalWidgets: [
                ...dataDashboard.widgets,
                new cw.GraphWidget({
                    height: 6,
                    width: 6,
                    liveData: true,
                    title: 'Stream Processor DLQ Length',
                    left: [
                        new cw.Metric({
                            namespace: 'AWS/SQS',
                            metricName: 'ApproximateNumberOfMessagesVisible',
                            dimensionsMap: { QueueName: props.streamProcessorDlqName },
                            period: cdk.Duration.minutes(1),
                            statistic: cw.Stats.MINIMUM,
                            unit: cw.Unit.COUNT,
                            label: 'EvidenceCollectorDLQLength',
                        }),
                    ],
                }),
            ],
        });
    }
}
