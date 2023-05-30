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
import {
    AGSLambdaFunction,
    AGSService,
    AgsServiceDashboard,
    AGSServiceProps,
    SubnetGroup,
} from '@ags-cdk/ags-service-template';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as synthetics from '@aws-cdk/aws-synthetics-alpha';
import { EvidenceStoreOnboarder } from './evidence-store-onboarder';
import { createEventBridgeRuleWidget } from './event-bridge-rule-widget';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { SolutionMetricsCollectorConstruct } from '@ags-cdk/ags-solution-metrics';
import { Construct } from 'constructs';
import { SyntheticsCanary } from './synthetics-canary';

export const SchemaId = 'sec-hub-evidence';

export const ProviderId = 'security-hub-evidence-collector';

const assumeRoleName = 'EvidenceCollectorReadOnlyRole';

const findingSourceProductArnsParamName = '/ags/shec/FindingSourceProductArns';

const FINDING_SOURCE_PRODUCT_ARNS = [
    'access-analyzer$',
    'guardduty$',
    'firewall-manager$',
    'inspector$',
    'macie$',
    'detective$',
    'ssm-patch-manager$',
];

export class SecurityHubEvidenceCollectorService extends AGSService {
    private kmsKeys: Record<string, kms.IKey>;

    constructor(scope: Construct, id: string, props: AGSServiceProps) {
        super(scope, id, props);

        this.setupCMKs();

        // fields used to generate custom user agent
        const solutionId = `AwsSolution/${props.solutionId ?? 'SO0176'}`;
        const solutionVersion = props.solutionVersion ?? 'v1.0.0';

        // get logLevel from config, default is info
        const lambdaLogLevel = this.getCurrentConfig()?.logLevel || 'info';

        // create the secret to hold api key
        const apiKeySecret = new secrets.Secret(this, 'api-key-secret', {
            removalPolicy: this.removalPolicy,
            description:
                'Evidence Store API Key assigned to Security Hub Evidence Collector',
        });
        const evidenceStoreApi = ssm.StringParameter.fromStringParameterName(
            this,
            'evidence-store-uri',
            '/ags/endpoints/AGSEvidenceStore'
        );

        // onboard as evidence provider
        const onboarder = new EvidenceStoreOnboarder(this, 'evidence-onboarder', {
            apiKeySecret,
            evidenceProviderId: ProviderId,
            evidenceStoreApi: evidenceStoreApi.stringValue,
            schemaId: SchemaId,
            sharedInfraClient: this.sharedInfraClient,
        });

        onboarder.node.addDependency(apiKeySecret, evidenceStoreApi);

        // create SSM parameter to store list of accepted finding sources
        const findingSourceProductArnsSsm = new ssm.StringListParameter(
            this,
            `FindingSourceProductArns`,
            {
                parameterName: findingSourceProductArnsParamName,
                stringListValue: FINDING_SOURCE_PRODUCT_ARNS,
            }
        );

        // dead letter queue for failed collector messages
        const deadLetterQueue = new sqs.Queue(this, 'EvidenceCollectorRateLimitDLQ', {
            queueName: `${this.serviceName}-EvidenceCollectorRateLimitDLQ.fifo`,
            fifo: true,
            encryption: sqs.QueueEncryption.KMS,
            encryptionMasterKey: this.kmsKeys.dlq,
            removalPolicy: this.removalPolicy,
        });

        // following best practices for source queue outlined here:
        // https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#events-sqs-queueconfig
        const evidenceCollectorRateLimitQueue = new sqs.Queue(
            this,
            'EvidenceCollectorRateLimitQueue',
            {
                queueName: `${this.serviceName}-EvidenceCollectorRateLimitQueue.fifo`,
                fifo: true,
                contentBasedDeduplication: true,
                retentionPeriod: cdk.Duration.hours(23),
                visibilityTimeout: cdk.Duration.minutes(6),
                deadLetterQueue: {
                    queue: deadLetterQueue,
                    maxReceiveCount: 1,
                },
                encryption: sqs.QueueEncryption.KMS,
                encryptionMasterKey: this.kmsKeys.rateLimiterQueue,
                removalPolicy: this.removalPolicy,
            }
        );

        // lambda function that contains the functionality
        const lambdaName = 'SecurityHubEvidenceCollector';
        const agsLambda = new AGSLambdaFunction(this, lambdaName, {
            description: 'Evidence Collector for Security Hub and Config',
            service: this,
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'app.lambdaHandler',
            iamRoleName: 'SecurityHubEvidenceCollectorRole',
            code: lambda.Code.fromAsset(
                path.resolve(__dirname, `../../app/lambda/.aws-sam/build/${lambdaName}`)
            ),
            memorySize: 256,
            environment: {
                LOG_LEVEL: lambdaLogLevel,
                API_SECRET_NAME: apiKeySecret.secretName,
                EVIDENCE_STORE_API_SSM: evidenceStoreApi.parameterName,
                FINDING_SOURCE_PRODUCT_ARNS_SSM:
                    findingSourceProductArnsSsm.parameterName,
                EVIDENCE_PROVIDER_ID: ProviderId,
                EVIDENCE_SCHEMA_ID: SchemaId,
                ASSUME_ROLE_NAME: assumeRoleName,
                SOLUTION_ID: solutionId,
                SOLUTION_VERSION: solutionVersion,
                EVIDENCE_ATTACHMENT_BUCKET_PARAM: '/ags/evidence-store/attachment-bucket',
            },
            timeout: cdk.Duration.minutes(1),
            environmentEncryption: this.kmsKeys.mainLambda,
            architecture: lambda.Architecture.ARM_64,
        });

        // allow lambda to get config details
        agsLambda.lambdaExecutionRole.addToPolicy(
            new iam.PolicyStatement({
                resources: ['*'],
                effect: iam.Effect.ALLOW,
                actions: [
                    'config:Get*',
                    'config:Describe*',
                    'config:Deliver*',
                    'config:List*',
                    'config:Select*',
                    'config:Batch*',
                ],
            })
        );

        // allow lambda to upload evidence attachment
        const evidenceBucketParam = ssm.StringParameter.fromStringParameterName(
            this,
            'attachment-bucket-param',
            '/ags/evidence-store/attachment-bucket'
        );

        const evidenceBucket = s3.Bucket.fromBucketName(
            this,
            'attachment-bucket',
            evidenceBucketParam.stringValue
        );

        // allow lambda to upload finding to attachment bucket
        evidenceBucket.grantWrite(agsLambda.lambdaFunction);

        const evidenceBucketEncryptionKey = kms.Key.fromLookup(
            this,
            'evidence-bucket-key',
            { aliasName: 'alias/AGSEvidenceStore-evidenceAttachmentBucket' }
        );

        // allow lambda to use evidence bucket encryption key to upload findings
        evidenceBucketEncryptionKey.grantEncryptDecrypt(agsLambda.lambdaExecutionRole);

        // allow lambda to assume role to retrieve tags from other accounts
        agsLambda.lambdaExecutionRole.addToPolicy(
            new iam.PolicyStatement({
                resources: [`arn:aws:iam::*:role/${assumeRoleName}`],
                effect: iam.Effect.ALLOW,
                actions: ['sts:AssumeRole'],
            })
        );

        // link collector queue to the lambda
        agsLambda.lambdaFunction.addEventSource(
            new SqsEventSource(evidenceCollectorRateLimitQueue)
        );

        // grant access for the lambda to get resource tags
        agsLambda.lambdaExecutionRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['tag:GetResources'],
                effect: iam.Effect.ALLOW,
                resources: ['*'],
            })
        );

        // grant access for the lambda to params from ssm
        agsLambda.lambdaExecutionRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['ssm:GetParameter'],
                effect: iam.Effect.ALLOW,
                resources: [
                    evidenceStoreApi.parameterArn,
                    findingSourceProductArnsSsm.parameterArn,
                    evidenceBucketParam.parameterArn,
                ],
            })
        );

        // grant access for the lambda to read the apiKeySecret
        apiKeySecret.grantRead(agsLambda.lambdaExecutionRole);

        // dedicated event bus
        const bus = new events.EventBus(this, 'shec-event-bus', {
            eventBusName: 'shec-event-bus',
        });

        // set the rule to target the evidence collector rate limit queue
        const secHubRule = new events.Rule(this, 'SecurityHubFindingsRule', {
            eventBus: bus,
            enabled: true,
            targets: [
                new targets.SqsQueue(evidenceCollectorRateLimitQueue, {
                    messageGroupId: 'sechub-finding',
                }),
            ],
            eventPattern: {
                source: ['aws.securityhub'],
                detailType: ['Security Hub Findings - Imported'],
            },
        });

        // set the rule to target the evidence collector rate limit queue
        const configRule = new events.Rule(this, 'ConfigFindingsRule', {
            eventBus: bus,
            enabled: true,
            targets: [
                new targets.SqsQueue(evidenceCollectorRateLimitQueue, {
                    messageGroupId: 'config-finding',
                }),
            ],
            eventPattern: {
                source: ['aws.config'],
                detailType: ['Config Rules Compliance Change'],
            },
        });

        const canaryName = 'shec-canary';

        const vpcConfig =
            this.sharedInfraClient.deploymentOptions.apiGatewayType === 'private'
                ? {
                      vpcId: this.sharedInfraClient.vpc.vpcId,
                      subnetIds: this.sharedInfraClient.vpc.selectSubnets(
                          this.sharedInfraClient.getSubnetsByGroupName(
                              SubnetGroup.SERVICE
                          )
                      ).subnetIds,
                      securityGroupIds: this.sharedInfraClient
                          .getSubnetSecurityGroups(SubnetGroup.SERVICE)
                          ?.map((securityGroup) => securityGroup.securityGroupId) || [
                          new ec2.SecurityGroup(this, 'canarySecurityGroup', {
                              vpc: this.sharedInfraClient.vpc,
                          }).securityGroupId,
                      ],
                  }
                : {
                      subnetIds: [],
                      securityGroupIds: [],
                  };

        const canary = new SyntheticsCanary(this, 'canary', {
            canaryName,
            runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_8,
            sharedInfraClient: this.sharedInfraClient,
            schedule: synthetics.Schedule.expression('rate(5 minutes)'),
            test: synthetics.Test.custom({
                code: synthetics.Code.fromAsset(
                    path.resolve(__dirname, `../../app/lambda/.aws-sam/canary`)
                ),
                handler: 'index.handler',
            }),
            startAfterCreation: true,
            environmentVariables: {
                EVIDENCE_STORE_API_SSM: evidenceStoreApi.parameterName,
                RATE_LIMIT_QUEUE_URL: evidenceCollectorRateLimitQueue.queueUrl,
            },
            removalPolicy: this.removalPolicy,
            s3BucketEncryptionKeyArn: this.kmsKeys.syntheticsCanaryLogBucket.keyArn,
            failureLogRetentionPeriod: 7,
            successLogRetentionPeriod: 1,
            vpcConfig,
        });

        // grant access to the canary to read params from ssm
        canary.canaryRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['ssm:GetParameter'],
                effect: iam.Effect.ALLOW,
                resources: [
                    evidenceStoreApi.parameterArn,
                    findingSourceProductArnsSsm.parameterArn,
                ],
            })
        );

        // allows the canary to send messages to the rate limit queue
        evidenceCollectorRateLimitQueue.grantSendMessages(canary.canaryRole);

        // metric for rate limit dlq length
        const evidenceCollectorDLQMetric = new cw.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: { QueueName: deadLetterQueue.queueName },
            period: cdk.Duration.minutes(1),
            statistic: cw.Stats.MINIMUM,
            unit: cw.Unit.COUNT,
            label: 'EvidenceCollectorDLQLength',
        });

        // metric for rate limit queue length
        const evidenceCollectorRateLimitQueueMetric = new cw.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: { QueueName: evidenceCollectorRateLimitQueue.queueName },
            period: cdk.Duration.minutes(1),
            statistic: cw.Stats.MINIMUM,
            unit: cw.Unit.COUNT,
            label: 'EvidenceCollectorRateLimitQueueLength',
        });

        // dashboard
        new AgsServiceDashboard(this, 'dashboard', {
            lambdas: [
                {
                    functionName: agsLambda.lambdaFunction.functionName,
                    friendlyName: 'SHEC Lambda',
                },
            ],
            serviceName: 'AGSSecurityHubEvidenceCollector',
            dashboardName: 'SecurityHubEvidenceCollectorDashboard',
            additionalWidgets: [
                createEventBridgeRuleWidget(secHubRule.ruleName),
                createEventBridgeRuleWidget(configRule.ruleName),
                new cw.GraphWidget({
                    height: 6,
                    width: 6,
                    liveData: true,
                    title: 'Queue Length',
                    left: [
                        evidenceCollectorDLQMetric,
                        evidenceCollectorRateLimitQueueMetric,
                    ],
                }),
                new cw.GraphWidget({
                    height: 6,
                    width: 6,
                    liveData: true,
                    title: 'Canary Status',
                    left: [
                        new cw.Metric({
                            metricName: 'SuccessPercent',
                            namespace: 'CloudWatchSynthetics',
                            label: 'Canary Status',
                            statistic: cw.Statistic.AVERAGE,
                            unit: cw.Unit.PERCENT,
                            dimensionsMap: { CanaryName: canaryName },
                        }),
                    ],
                }),
            ],
            canaryName,
        });

        // metrics collector
        new SolutionMetricsCollectorConstruct(this, 'solution-metrics-collector', {
            solutionId,
            solutionDisplayName: 'AWS Verifiable Control Evidence Store',
            sendAnonymousMetrics:
                this.getCurrentConfig()?.publishOperationalMetrics === 'N' ? 'No' : 'Yes',
            version: solutionVersion,
            metricsData: {
                byoKeys: this.getCurrentConfig()?.customerManagedCMKArns !== undefined,
                retainData: this.getCurrentConfig()?.retainData ?? false,
                dataRemovalPolicy: this.removalPolicy,
            },
        });
    }

    private setupCMKs() {
        const resolveKey = (name: string, arn: string) =>
            this.importCMK(name, arn) ?? this.createCMK(name);

        const customerManagedCMKArns = (<unknown>(
            this.getCurrentConfig()?.customerManagedCMKArns
        )) as Record<string, string>;

        this.kmsKeys = {
            mainLambda: resolveKey('mainLambda', customerManagedCMKArns?.mainLambda),
            dlq: resolveKey('dlq', customerManagedCMKArns?.dlq),
            rateLimiterQueue: resolveKey(
                'rateLimiterQueue',
                customerManagedCMKArns?.rateLimiterQueue
            ),
            syntheticsCanaryLogBucket: resolveKey(
                'syntheticsCanaryLogBucket',
                customerManagedCMKArns?.syntheticsCanaryLogBucket
            ),
        };
    }

    private importCMK(name: string, arn?: string): kms.IKey | null {
        return arn ? kms.Key.fromKeyArn(this, `CMKKey${name}`, arn) : null;
    }

    private createCMK(name: string): kms.Key {
        return new kms.Key(this, `CMKKey${name}`, {
            description: `KMS Key for ${this.serviceName}/${name}`,
            alias: `${this.serviceName}-${name}`,
            enableKeyRotation: true,
            removalPolicy: this.removalPolicy,
        });
    }
}
