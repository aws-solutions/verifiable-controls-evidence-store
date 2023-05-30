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
import * as appConfig from '../../app/lambda/src/common/configuration/AppConfiguration';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEvent from 'aws-cdk-lib/aws-lambda-event-sources';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as path from 'path';
import * as qldb from 'aws-cdk-lib/aws-qldb';
import * as sqs from 'aws-cdk-lib/aws-sqs';

import {
    AGSLambdaFunction,
    AGSService,
    SubnetGroup,
} from '@ags-cdk/ags-service-template';

import { Construct } from 'constructs';

export interface QldbReplicaProps {
    ledgerName: string;
    ledgerArn: string;
    service: AGSService;
    removalPolicy: cdk.RemovalPolicy;
    dataStreamEncryptionKey: kms.IKey;
    elasticSearchEncryptionKey: kms.IKey;
    streamProcessorLambdaEncryptionKey: kms.IKey;
    dlqEncryptionKey: kms.IKey;
    evidenceStoreLambdaFunctionRoleName: string;
    httpProxy?: string;
    customUserAgent: string;
}

export class QldbReplica extends Construct {
    readonly cidrRegex = new RegExp(
        '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(\\d|[1-2]\\d|3[0-2]))?$'
    );
    readonly readReplica: opensearch.Domain;
    readonly streamProcessingLambda: lambda.Function;
    readonly dlq: sqs.IQueue;

    constructor(scope: Construct, id: string, props: QldbReplicaProps) {
        super(scope, id);

        const streamProcessingLambdaRoleName = 'ags-evidence-stream-processor-role';

        // create the kinesis data stream
        const dataStream = new kinesis.Stream(scope, 'kinesis-evidence-data-stream', {
            retentionPeriod: cdk.Duration.days(7),
            encryption: kinesis.StreamEncryption.KMS,
            encryptionKey: props.dataStreamEncryptionKey,
            streamMode: kinesis.StreamMode.ON_DEMAND,
        });

        // create the qldb stream role
        const qldbStreamRole = new iam.Role(this, 'qldb-stream-role', {
            assumedBy: new iam.ServicePrincipal('qldb.amazonaws.com'),
            inlinePolicies: {
                'qldb-stream-policy': new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: [
                                'kinesis:PutRecord*',
                                'kinesis:DescribeStream',
                                'kinesis:ListShards',
                            ],
                            resources: [dataStream.streamArn],
                        }),
                        new iam.PolicyStatement({
                            actions: ['kms:GenerateDataKey'],
                            resources: [props.dataStreamEncryptionKey.keyArn],
                        }),
                    ],
                }),
            },
        });

        // create the qldb stream
        new qldb.CfnStream(this, 'evidence-stream', {
            streamName: 'evidence-stream',
            inclusiveStartTime: new Date(2021, 1, 1).toISOString(),
            kinesisConfiguration: {
                aggregationEnabled: true,
                streamArn: dataStream.streamArn,
            },
            roleArn: qldbStreamRole.roleArn,
            ledgerName: props.ledgerName,
        });

        // service linked role is required for es to access resources in a vpc
        // as of 1.93.0 the es cdk package doesn't offer the ability to create a service linked role
        // creating one manually
        let serviceLinkedRole: cdk.CfnResource | undefined;

        if (!props.service.sharedInfraClient.elasticSearchServiceLinkedRoleAvailable) {
            serviceLinkedRole = new cdk.CfnResource(
                this,
                'opensearch-service-linked-role',
                {
                    type: 'AWS::IAM::ServiceLinkedRole',
                    properties: {
                        AWSServiceName: 'opensearchservice.amazonaws.com',
                        Description: 'Role for OpenSearch to access resources in my VPC',
                    },
                }
            );
        }

        const azCount = props.service.sharedInfraClient.vpc.availabilityZones.length;

        const zoneAwareness: opensearch.ZoneAwarenessConfig = { enabled: true };

        let securityGroups = props.service.sharedInfraClient.getSubnetSecurityGroups(
            SubnetGroup.DATABASE
        );

        if (!securityGroups) {
            const securityGroup = new ec2.SecurityGroup(this, 'es-inbound-sg', {
                vpc: props.service.sharedInfraClient.vpc,
            });

            const vpc = ec2.Vpc.fromLookup(this, 'evidence-vpc', {
                vpcId: props.service.sharedInfraClient.vpc.vpcId,
            });

            if (azCount > 0) {
                vpc.privateSubnets.forEach((it) => {
                    if (this.cidrRegex.test(it.ipv4CidrBlock)) {
                        securityGroup.addIngressRule(
                            ec2.Peer.ipv4(it.ipv4CidrBlock),
                            ec2.Port.tcp(443),
                            'Allow inboud https from private subnets.'
                        );
                    }
                });
            }

            securityGroups = [securityGroup];
        }

        const subnetSelection = props.service.sharedInfraClient.getSubnetsByGroupName(
            SubnetGroup.DATABASE
        );

        // create elastic search cluster
        const domainName = 'ags-evidence-read-replica';
        this.readReplica = new opensearch.Domain(this, 'evidence-open-search-domain', {
            domainName,
            version: opensearch.EngineVersion.openSearch('2.3'),
            capacity: {
                masterNodes: 3,
                dataNodes: azCount,
                masterNodeInstanceType:
                    props.service.getCurrentConfig()?.openSearchMasterNodeInstanceType,
                dataNodeInstanceType:
                    props.service.getCurrentConfig()?.openSearchDataNodeInstanceType,
            },
            zoneAwareness,
            vpc: props.service.sharedInfraClient.vpc,
            securityGroups: securityGroups,
            vpcSubnets:
                subnetSelection &&
                props.service.sharedInfraClient.vpc.selectSubnets(subnetSelection).subnets
                    .length > 0
                    ? [subnetSelection]
                    : [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
            logging: { slowSearchLogEnabled: true, slowIndexLogEnabled: true },
            encryptionAtRest: { enabled: true, kmsKey: props.elasticSearchEncryptionKey },
            nodeToNodeEncryption: true,
            enforceHttps: true,
            removalPolicy: props.removalPolicy,
            accessPolicies: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'es:ESHttpDelete',
                        'es:ESHttpPost',
                        'es:ESHttpPut',
                        'es:ESHttpPatch',
                    ],
                    resources: [`${this.getDomainArn(domainName)}/*`],
                    principals: [
                        new iam.ArnPrincipal(
                            this.getRoleArn(streamProcessingLambdaRoleName)
                        ),
                    ],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['es:ESHttpGet', 'es:ESHttpHead', 'es:ESHttpPost'],
                    resources: [`${this.getDomainArn(domainName)}/*`],
                    principals: [
                        new iam.ArnPrincipal(
                            this.getRoleArn(props.evidenceStoreLambdaFunctionRoleName)
                        ),
                    ],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['logs:*'],
                    resources: ['*'],
                    principals: [new iam.ServicePrincipal('es.amazonaws.com')],
                }),
            ],
            advancedOptions: {},
        });

        if (serviceLinkedRole) {
            this.readReplica.node.addDependency(serviceLinkedRole);
        }

        const environmentVarialbes = {
            ELASTICSEARCH_DOMAIN: `https://${this.readReplica.domainEndpoint}/`,
            [appConfig.environmentVariables.EvidenceLedgerName]: props.ledgerName,
            [appConfig.environmentVariables.UserAgent]: props.customUserAgent,
        };

        if (props.httpProxy) {
            environmentVarialbes[appConfig.environmentVariables.ProxyUri] =
                props.httpProxy;
        }

        this.dlq = new sqs.Queue(this, 'evidence-stream-processor-dlq', {
            encryption: sqs.QueueEncryption.KMS,
            encryptionMasterKey: props.dlqEncryptionKey,
            removalPolicy: props.removalPolicy,
        });

        const fn = new AGSLambdaFunction(this, 'evidence-stream-processor', {
            environmentEncryption: props.streamProcessorLambdaEncryptionKey,
            iamRoleName: streamProcessingLambdaRoleName,
            code: lambda.Code.fromAsset(
                path.join(
                    __dirname,
                    '../../app/lambda/.aws-sam/build/evidences-stream-processor'
                )
            ),
            handler: 'index.handler',
            runtime: lambda.Runtime.NODEJS_18_X,
            environment: environmentVarialbes,
            service: props.service,
            initialPolicy: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['cloudwatch:PutMetricData'],
                    resources: ['*'],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                    ],
                    resources: ['*'],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['qldb:GetDigest'],
                    resources: [props.ledgerArn],
                }),
            ],
            timeout: cdk.Duration.minutes(1),
            description: 'AGS Evidence Store Stream Processing Lambda',
            architecture: lambda.Architecture.ARM_64,
            retryAttempts: 1,
            deadLetterQueue: this.dlq,
        });

        this.readReplica.grantWrite(fn.lambdaFunction);

        fn.lambdaFunction.addEventSource(
            new lambdaEvent.KinesisEventSource(dataStream, {
                startingPosition: lambda.StartingPosition.TRIM_HORIZON,
                bisectBatchOnError: true,
                retryAttempts: 2,
            })
        );

        this.streamProcessingLambda = fn.lambdaFunction;
    }

    private getRoleArn(roleName: string): string {
        const stack = cdk.Stack.of(this);

        return `arn:${stack.partition}:iam::${stack.account}:role/${roleName}`;
    }

    private getDomainArn(domainName: string): string {
        const stack = cdk.Stack.of(this);

        return `arn:${stack.partition}:es:${stack.region}:${stack.account}:domain/${domainName}`;
    }
}
