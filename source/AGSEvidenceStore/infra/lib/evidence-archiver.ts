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
import * as kms from 'aws-cdk-lib/aws-kms';
import * as qldb from 'aws-cdk-lib/aws-qldb';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as iam from 'aws-cdk-lib/aws-iam';
import { AgsSecureBucket } from '@ags-cdk/ags-service-template';
import { Construct } from 'constructs';
export interface EvidenceArchiverProps {
    evidenceLedgerName: string;
    removalPolicy: cdk.RemovalPolicy;
    dataStreamEncryptionKey: kms.IKey;
    archiveBucketEncryptionKey: kms.IKey;
}

export class EvidenceArchiver extends Construct {
    constructor(scope: Construct, id: string, props: EvidenceArchiverProps) {
        super(scope, id);

        const archiveBucket = new AgsSecureBucket(this, 'archive-bucket', {
            lifecycleRules: [{ expiration: cdk.Duration.days(3) }],
            autoDeleteObjects: props.removalPolicy == cdk.RemovalPolicy.DESTROY,
            removalPolicy: props.removalPolicy,
            encryptionKeyArn: props.archiveBucketEncryptionKey.keyArn,
        });

        const dataStream = new kinesis.Stream(this, 'archive-data-stream', {
            encryption: kinesis.StreamEncryption.KMS,
            encryptionKey: props.dataStreamEncryptionKey,
            retentionPeriod: cdk.Duration.days(7),
            streamMode: kinesis.StreamMode.ON_DEMAND,
        });

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

        const qldbStream = new qldb.CfnStream(this, 'evidence-archiving-stream', {
            streamName: 'data-archiving-stream',
            inclusiveStartTime: new Date(2021, 1, 1).toISOString(),
            kinesisConfiguration: {
                aggregationEnabled: true,
                streamArn: dataStream.streamArn,
            },
            roleArn: qldbStreamRole.roleArn,
            ledgerName: props.evidenceLedgerName,
        });

        qldbStream.node.addDependency(qldbStreamRole);
        qldbStream.node.addDependency(dataStream);

        const firehoseRole = new iam.Role(this, 'archiving-firehose-role', {
            assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
        });
        dataStream.grantReadWrite(firehoseRole);
        dataStream.grant(firehoseRole, 'kinesis:DescribeStream');
        archiveBucket.bucket.grantWrite(firehoseRole);

        const firehoseDeliveryStream = new firehose.CfnDeliveryStream(
            this,
            'archiving-fire-hose',
            {
                deliveryStreamType: 'KinesisStreamAsSource',
                s3DestinationConfiguration: {
                    bucketArn: archiveBucket.bucket.bucketArn,
                    roleArn: firehoseRole.roleArn,
                },
                kinesisStreamSourceConfiguration: {
                    kinesisStreamArn: dataStream.streamArn,
                    roleArn: firehoseRole.roleArn,
                },
            }
        );

        firehoseDeliveryStream.node.addDependency(firehoseRole);
    }
}
