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
import * as cdk from 'aws-cdk-lib';
import * as cfnSynthetics from 'aws-cdk-lib/aws-synthetics';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as synthetics from '@aws-cdk/aws-synthetics-alpha';
import * as targets from 'aws-cdk-lib/aws-events-targets';

import { AGSSharedInfraClient, SubnetGroup } from '@ags-cdk/ags-service-template';
import { Metric, MetricOptions } from 'aws-cdk-lib/aws-cloudwatch';

import { Construct } from 'constructs';
import { SecureBucket } from './secure-bucket';

export interface SyntheticsCanaryProps {
    /**
     * Name of the canary, must match ^[0-9a-z_\-]+$
     *
     * @required
     */
    readonly canaryName: string;

    /**
     * Specify the runtime version to use for the canary.
     *
     * @required
     */
    readonly runtime: synthetics.Runtime;

    /**
     * The type of test that you want your canary to run.
     *
     * Use `Test.custom()` to specify the test to run.
     *
     * @required
     */
    readonly test: synthetics.Test;

    /**
     * Specify the schedule for how often the canary runs.
     *
     * @optional
     * @default Once every 5 minutes (rate(5 minutes))
     */
    readonly schedule?: synthetics.Schedule;

    /**
     * Whether or not the canary should start after creation.
     *
     * @optional
     * @default true
     */
    readonly startAfterCreation?: boolean;

    /**
     * Environment variables to be passed into canary test script
     *
     * @optional
     */
    readonly environmentVariables?: Record<string, string>;

    /**
     * Canary test timeout in seconds
     *
     * @optional
     * @default 15 seconds
     */
    readonly timeoutInSeconds?: number;

    /**
     * AGS Shared Infra Client instance
     *
     * @optional
     */
    readonly sharedInfraClient?: AGSSharedInfraClient;

    /**
     * VPC configuration if canary will run inside the VPC
     *
     * If both sharedInfraClient and vpcConfig specified, vpcConfig will override the vpc setting in shared infra client.
     *
     * @optional
     * @default Canary will run without VPC
     */
    readonly vpcConfig?: cfnSynthetics.CfnCanary.VPCConfigProperty;

    /**
     * The S3 bucket prefix
     *
     * @optional - Specify this if you want a more specific path within the artifacts bucket.
     * @default No prefix
     */
    readonly s3BucketPrefix?: string;

    /**
     * Specify the ARN of the SNS Topic that the failed canary test alert to be sent to
     *
     * @optional
     * @default None - no alert to be sent to SNS topic
     */
    readonly alertSNSTopicArn?: string;

    /**
     * Specify if the artifact bucket should be removed when canary is destroyed
     *
     * Available option is in cdk.RemovalPolicy
     *
     * @optional
     * @default cdk.RemovalPolicy.DESTROY
     */
    readonly removalPolicy?: cdk.RemovalPolicy;

    /**
     * The canary's bucket encryption key arn
     *
     * @optional - If a key arn is specified, the corresponding KMS key will be used to encrypt canary S3 bucket.
     * @default None - A new key is provisioned for the canary S3 bucket.
     */
    readonly s3BucketEncryptionKeyArn?: string;

    /** The canary log bucket
     *
     * @optional - All canary logs will be stored in the provided bucket.
     * @default None - A new bucket is provisioned for the canary.
     */
    readonly canaryLogBucket?: s3.IBucket;

    /** The number of days to retain data about failed runs of this canary
     *
     * @optional
     * @default None - If none of provided, cdk automatically applies the default value of 31 days.
     */
    readonly failureLogRetentionPeriod?: number;

    /** The number of days to retain data about successful runs of this canary
     *
     * @optional
     * @default None - If none of provided, cdk automatically applies the default value of 31 days.
     */
    readonly successLogRetentionPeriod?: number;
}

const canaryNameReg = /^[0-9a-z_-]+$/;

export class SyntheticsCanary extends Construct {
    public readonly canaryRole: iam.Role;
    private readonly canaryName: string;

    constructor(scope: Construct, id: string, props: SyntheticsCanaryProps) {
        super(scope, id);

        if (props.canaryName.length > 21) {
            throw 'Canary name must be less than 21 characters in length.';
        }

        if (!canaryNameReg.test(props.canaryName)) {
            throw `Invalid canary name, must match /^[0-9a-z_-]+$/`;
        }

        this.canaryName = props.canaryName;
        const removePolicy = props.removalPolicy ?? cdk.RemovalPolicy.DESTROY;

        // create canary artifacts bucket
        const artifactsBucket = props?.canaryLogBucket
            ? props.canaryLogBucket
            : new SecureBucket(this, 'CanaryArtifactBucket', {
                  autoDeleteObjects: removePolicy === cdk.RemovalPolicy.DESTROY,
                  removalPolicy: removePolicy,
                  encryptionKeyArn: props.s3BucketEncryptionKeyArn,
              }).bucket;

        const prefix = props.s3BucketPrefix || '';

        // create canary execution role
        this.canaryRole = new iam.Role(this, `CanaryExecutionRole`, {
            assumedBy: new iam.ServicePrincipal('lambda'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole'
                ),
                // must to have this one for lambda to run in VPC
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaVPCAccessExecutionRole'
                ),
            ],
            inlinePolicies: {
                CanaryPolicy: this.getCanaryRolePolicyDoc(artifactsBucket, prefix),
            },
            description: 'Execution Role for CloudWatch Synthetics Canary',
        });

        // put canary in VPC if apigateway is configured as private
        const sharedInfraVpcConfig = props.sharedInfraClient
            ? props.sharedInfraClient.deploymentOptions.apiGatewayType === 'private'
                ? {
                      vpcId: props.sharedInfraClient.vpc.vpcId,
                      subnetIds: props.sharedInfraClient.vpc.selectSubnets(
                          props.sharedInfraClient.getSubnetsByGroupName(
                              SubnetGroup.SERVICE
                          )
                      ).subnetIds,
                      securityGroupIds:
                          props.sharedInfraClient
                              .getSubnetSecurityGroups(SubnetGroup.SERVICE)
                              ?.map((securityGroup) => securityGroup.securityGroupId) ||
                          [],
                  }
                : undefined
            : undefined;

        const vpcConfig = props.vpcConfig ?? sharedInfraVpcConfig;

        const scheduleExpressString =
            props.schedule?.expressionString ?? 'rate(5 minutes)';

        // create synthetics canary
        new cfnSynthetics.CfnCanary(this, 'Canary', {
            artifactS3Location: artifactsBucket.s3UrlForObject(prefix),
            executionRoleArn: this.canaryRole.roleArn,
            runtimeVersion: props.runtime.name,
            name: props.canaryName,
            schedule: {
                expression: scheduleExpressString,
            },
            startCanaryAfterCreation: props.startAfterCreation ?? true,
            code: this.createCode(props.test),
            runConfig: {
                activeTracing: true,
                timeoutInSeconds: props.timeoutInSeconds ?? 15,
                environmentVariables: props.environmentVariables,
            },
            vpcConfig,
            failureRetentionPeriod: props.failureLogRetentionPeriod,
            successRetentionPeriod: props.successLogRetentionPeriod,
        });

        // create cloudwatch event rule to send failed alert to SNS topic
        if (props.alertSNSTopicArn) {
            const alertTopic = sns.Topic.fromTopicArn(
                this,
                'CanaryAlertSNSTopic',
                props.alertSNSTopicArn
            );

            new events.Rule(this, 'CanaryTestEventRule', {
                description: 'Event rule for monitoring Canary Test Results',
                eventPattern: {
                    source: ['aws.synthetics'],
                    detailType: ['Synthetics Canary TestRun Failure'],
                    detail: {
                        'canary-name': [props.canaryName],
                        'test-run-status': ['FAILED'],
                    },
                },
                targets: [
                    new targets.SnsTopic(alertTopic, {
                        message: events.RuleTargetInput.fromText(
                            `Canary test ${props.canaryName} failed on in account ${cdk.Aws.ACCOUNT_ID}`
                        ),
                    }),
                ],
            });
        }
    }

    private createCode(test: synthetics.Test): cfnSynthetics.CfnCanary.CodeProperty {
        const codeConfig = {
            handler: test.handler,
            ...test.code.bind(this, test.handler, synthetics.RuntimeFamily.NODEJS),
        };
        return {
            handler: codeConfig.handler,
            script: codeConfig.inlineCode,
            s3Bucket: codeConfig.s3Location?.bucketName,
            s3Key: codeConfig.s3Location?.objectKey,
            s3ObjectVersion: codeConfig.s3Location?.objectVersion,
        };
    }

    private getCanaryRolePolicyDoc(
        artifactsBucket: s3.IBucket,
        prefix: string
    ): iam.PolicyDocument {
        const { partition } = cdk.Stack.of(this);
        const policy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: ['s3:ListAllMyBuckets'],
                }),
                new iam.PolicyStatement({
                    resources: [
                        artifactsBucket.arnForObjects(`${prefix ? prefix + '/*' : '*'}`),
                    ],
                    actions: ['s3:PutObject', 's3:GetBucketLocation'],
                }),
                new iam.PolicyStatement({
                    resources: [artifactsBucket.bucketArn],
                    actions: ['s3:GetBucketLocation'],
                }),
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: ['cloudwatch:PutMetricData'],
                    conditions: {
                        StringEquals: { 'cloudwatch:namespace': 'CloudWatchSynthetics' },
                    },
                }),
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: ['xray:PutTraceSegments'],
                }),
                new iam.PolicyStatement({
                    resources: [`arn:${partition}:logs:::*`],
                    actions: [
                        'logs:CreateLogStream',
                        'logs:CreateLogGroup',
                        'logs:PutLogEvents',
                    ],
                }),
            ],
        });
        return policy;
    }
    /**
     * Measure the number of failed canary runs over a given time period.
     *
     * Default: sum over 5 minutes
     *
     * @param options - configuration options for the metric
     */
    public metricFailed(options?: MetricOptions): Metric {
        return new Metric({
            namespace: 'CloudWatchSynthetics',
            metricName: 'Failed',
            dimensionsMap: {
                CanaryName: this.canaryName,
            },
            statistic: 'Sum',
            ...options,
        }).attachTo(this);
    }
}
