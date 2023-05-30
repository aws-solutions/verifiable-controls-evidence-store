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
import * as file from 'fs';
import * as appConfig from '../../app/lambda/src/common/configuration/AppConfiguration';
import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as qldb from 'aws-cdk-lib/aws-qldb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as synthetics from '@aws-cdk/aws-synthetics-alpha';
import { SolutionMetricsCollectorConstruct } from '@ags-cdk/ags-solution-metrics';
import { Construct } from 'constructs';

import {
    AGSLambdaFunction,
    AGSRestApi,
    AGSService,
    AGSServiceProps,
} from '@ags-cdk/ags-service-template';

import { EvidenceStoreApiDefinition } from './evidence-store-api-definition';
import { QldbReplica } from './qldb-replica';
import { QldbTableCreatorCustomResource } from './qldb-table-creator';
import { EvidenceStoreDashboard } from './evidence-store-dashboard';
import { EvidenceArchiver } from './evidence-archiver';
import { userPermission } from './api-permission';
import { HttpMethods } from 'aws-cdk-lib/aws-s3';
import { S3EvidenceCollector } from './s3-evidence-collector';
import { SecureBucket } from './secure-bucket';
import { SyntheticsCanary } from './synthetics-canary';

export class EvidenceStore extends AGSService {
    private kmsKeys: Record<string, kms.IKey>;

    constructor(scope: Construct, id: string, props: AGSServiceProps) {
        super(scope, id, props);

        this.setupCMKs();

        const proxyUri: string | undefined = this.getCurrentConfig()?.proxyUri;
        const evidenceLambdaRoleName = 'evidence-store-lambda-function-role';
        const solutionId = props.solutionId ?? 'SO0176';
        const solutionVersion = props.solutionVersion ?? 'v1.0.0';
        const userAgent = `AwsSolution/${solutionId}/${solutionVersion}`;

        // The evidence content S3 bucket
        const evidenceContentBucket = new SecureBucket(this, 'evidence-content-bucket', {
            autoDeleteObjects: this.removalPolicy == cdk.RemovalPolicy.DESTROY,
            removalPolicy: this.removalPolicy,
            encryptionKeyArn: this.kmsKeys.evidenceContentBucket.keyArn,
        });

        // The evidence QLDB ledger
        const evidenceLedger = new qldb.CfnLedger(this, `evidence-ledger`, {
            permissionsMode: 'ALLOW_ALL',
            name: 'Evidences',
            kmsKey: this.kmsKeys.evidenceLedger.keyArn,
        });

        const ledgerArn = `arn:${cdk.Aws.PARTITION}:qldb:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:ledger/${evidenceLedger.name}`;

        // The evidence provider DynamoDB table
        const evidenceProviderTable = new ddb.Table(this, 'evidence-provider-table', {
            encryption: ddb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: this.kmsKeys.evidenceProviderTable,
            partitionKey: { name: 'providerId', type: ddb.AttributeType.STRING },
            tableName: 'evidence-providers',
            removalPolicy: this.removalPolicy,
            pointInTimeRecovery: true,
            timeToLiveAttribute: 'ttl',
        });

        const evidenceSchemaTable = new ddb.Table(this, 'evidence-schema-table', {
            tableName: 'evidence-schemas',
            partitionKey: { name: 'schemaId', type: ddb.AttributeType.STRING },
            sortKey: { name: 'providerId', type: ddb.AttributeType.STRING },
            encryption: ddb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: this.kmsKeys.evidenceSchemaTable,
            removalPolicy: this.removalPolicy,
            pointInTimeRecovery: true,
            timeToLiveAttribute: 'ttl',
        });

        evidenceSchemaTable.addGlobalSecondaryIndex({
            indexName: 'providerId',
            partitionKey: { name: 'providerId', type: ddb.AttributeType.STRING },
        });

        // QLDB replica
        const replica = new QldbReplica(this, 'qldb-replica', {
            ledgerName: evidenceLedger.name!,
            ledgerArn: ledgerArn,
            service: this,
            removalPolicy: this.removalPolicy,
            dataStreamEncryptionKey: this.kmsKeys.replicaStream,
            elasticSearchEncryptionKey: this.kmsKeys.elasticSearch,
            evidenceStoreLambdaFunctionRoleName: evidenceLambdaRoleName,
            httpProxy: proxyUri,
            streamProcessorLambdaEncryptionKey: this.kmsKeys.streamProcessor,
            customUserAgent: userAgent,
            dlqEncryptionKey: this.kmsKeys.streamProcessorDlq,
        });

        // the attachment bucket
        const attachmentBucket = new SecureBucket(this, 'attachment-bucket', {
            autoDeleteObjects: this.removalPolicy == cdk.RemovalPolicy.DESTROY,
            removalPolicy: this.removalPolicy,
            encryptionKeyArn: this.kmsKeys.evidenceAttachmentBucket.keyArn,
            cors: [
                {
                    allowedMethods: [HttpMethods.PUT],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                    exposedHeaders: [],
                },
            ],
        });

        // grant ui user permission to upload attachments
        const uiUser = iam.Role.fromRoleArn(
            this,
            'ui-user-role',
            `arn:${cdk.Aws.PARTITION}:iam::${cdk.Aws.ACCOUNT_ID}:role/AGSExternalUserRole`
        );

        attachmentBucket.bucket.grantPut(uiUser);

        new ssm.StringParameter(this, 'attachment-bucket-param', {
            stringValue: attachmentBucket.bucket.bucketName,
            parameterName: '/ags/evidence-store/attachment-bucket',
            description: 'Evidence store attachment bucket names',
        });

        replica.node.addDependency(evidenceLedger);

        const apiUsagePlanParamName = '/ags/evidence-store/api-usage-plan-id';

        const lambdaEnvironmentVariables = {
            [appConfig.environmentVariables.EvidenceLedgerName]: evidenceLedger.name!,
            [appConfig.environmentVariables.EvidenceContentBucketName]:
                evidenceContentBucket.bucket.bucketName,
            [appConfig.environmentVariables.EvidenceProviderTableName]:
                evidenceProviderTable.tableName,
            [appConfig.environmentVariables
                .EvidenceElasticSearchNode]: `https://${replica.readReplica.domainEndpoint}/`,
            [appConfig.environmentVariables.EvidenceSchemaTableName]:
                evidenceSchemaTable.tableName,
            [appConfig.environmentVariables.EvidenceStoreApiUsagePlanSSMParameter]:
                apiUsagePlanParamName,
            [appConfig.environmentVariables.UserAgent]: userAgent,
            [appConfig.environmentVariables.EvidenceAttachmentBucketName]:
                attachmentBucket.bucket.bucketName,
        };

        if (proxyUri) {
            lambdaEnvironmentVariables[appConfig.environmentVariables.ProxyUri] =
                proxyUri;
        }

        // The Lambda function that contains the functionality
        const lambdaName = 'evidence-store'; //?? Really?
        const agsLambda = new AGSLambdaFunction(this, lambdaName, {
            environmentEncryption: this.kmsKeys.mainLambda,
            iamRoleName: evidenceLambdaRoleName,
            service: this,
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'app.lambdaHandler',
            code: lambda.Code.fromAsset(
                path.resolve(__dirname, `../../app/lambda/.aws-sam/build/${lambdaName}`)
            ),
            environment: lambdaEnvironmentVariables,
            initialPolicy: [
                new iam.PolicyStatement({
                    actions: [
                        'qldb:List*',
                        'qldb:Describe*',
                        'qldb:Get*',
                        'qldb:SendCommand',
                    ],
                    effect: iam.Effect.ALLOW,
                    resources: [ledgerArn],
                }),
                new iam.PolicyStatement({
                    actions: ['ssm:GetParameter'],
                    effect: iam.Effect.ALLOW,
                    resources: [
                        `arn:${cdk.Aws.PARTITION}:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter${apiUsagePlanParamName}`,
                    ],
                }),
                new iam.PolicyStatement({
                    actions: ['apigateway:POST'],
                    effect: iam.Effect.ALLOW,
                    resources: [
                        `arn:${cdk.Aws.PARTITION}:apigateway:${cdk.Aws.REGION}::/apikeys`,
                        `arn:${cdk.Aws.PARTITION}:apigateway:${cdk.Aws.REGION}::/usageplans/*/keys`,
                    ],
                }),
            ],
            description: 'AGS Evidence Store Lambda',
            timeout: cdk.Duration.seconds(30),
            architecture: lambda.Architecture.ARM_64,
            memorySize: 256,
        });

        replica.readReplica.grantRead(agsLambda.lambdaFunction);

        evidenceContentBucket.bucket.grantRead(replica.streamProcessingLambda);

        attachmentBucket.bucket.grantRead(agsLambda.lambdaFunction);

        // lambda execution role's permission
        evidenceContentBucket.bucket.grantReadWrite(agsLambda.lambdaFunction);
        evidenceProviderTable.grantReadWriteData(agsLambda.lambdaFunction);
        evidenceSchemaTable.grantReadWriteData(agsLambda.lambdaFunction);

        // An API Gateway to make the Lambda web-accessible
        const evidenceApi = new AGSRestApi(this, 'Api', {
            service: this,
            lambdaFunction: agsLambda,
            apiExternalUserPermissions: userPermission,
            enableProxyAll: false,
        });

        new EvidenceStoreApiDefinition(this, 'api-definition', {
            evidenceStoreApiGateway: evidenceApi.api,
        });

        // qldb archiving
        const archiver = new EvidenceArchiver(this, 'evidence-archiver', {
            evidenceLedgerName: evidenceLedger.name!,
            removalPolicy: this.removalPolicy,
            archiveBucketEncryptionKey: this.kmsKeys.archiveBucket,
            dataStreamEncryptionKey: this.kmsKeys.archiveStream,
        });
        archiver.node.addDependency(evidenceLedger);

        // canary evidence provider api key
        const apiKeyValue = 'evidence-canary-api-key';

        const usagePlan = evidenceApi.api.addUsagePlan('evidence-store-usage-plan', {
            name: 'evidence-store-usage-plan',
            apiStages: [{ api: evidenceApi.api, stage: evidenceApi.api.deploymentStage }],
        });

        const apiKey = evidenceApi.api.addApiKey('canary-api-key', {
            apiKeyName: 'canary-api-key',
            value: apiKeyValue,
        });

        usagePlan.addApiKey(apiKey);

        new ssm.StringParameter(this, 'evidence-store-api-usage-plan', {
            stringValue: usagePlan.usagePlanId,
            parameterName: apiUsagePlanParamName,
        });

        // Provision the table
        const tableProvisioner = new QldbTableCreatorCustomResource(
            this,
            'evidences-table-creator',
            {
                ledgerArn: ledgerArn,
                ledgerName: evidenceLedger.name!,
                tableName: 'evidences',
                indexField: 'evidenyceId',
                canaryAuthorityApiKey: apiKeyValue,
                authorityTable: evidenceProviderTable,
                schemaTable: evidenceSchemaTable,
            }
        );

        tableProvisioner.node.addDependency(evidenceLedger);

        const canaryName = 'evidence-store-canary';

        new SyntheticsCanary(this, 'canary', {
            canaryName,
            runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_8,
            sharedInfraClient: this.sharedInfraClient,
            schedule: synthetics.Schedule.expression('rate(5 minutes)'),
            test: synthetics.Test.custom({
                code: synthetics.Code.fromInline(
                    file
                        .readFileSync(
                            path.join(
                                __dirname,
                                '../../app/lambda/.aws-sam/build/canary/index.js'
                            )
                        )
                        .toString()
                ),
                handler: 'index.handler',
            }),
            startAfterCreation: true,
            environmentVariables: {
                EVIDENCE_STORE_API: evidenceApi.api.url,
                API_KEY: apiKeyValue,
            },
            removalPolicy: this.removalPolicy,
            s3BucketEncryptionKeyArn: this.kmsKeys.syntheticsCanaryLogBucket.keyArn,
            failureLogRetentionPeriod: 7,
            successLogRetentionPeriod: 1,
            timeoutInSeconds: 30,
        });

        // operations dashboard
        new EvidenceStoreDashboard(this, 'evidence-store-dashboard-construct', {
            serviceName: this.serviceName,
            apiName: evidenceApi.api.restApiName,
            mainLambdaFunctionName: agsLambda.lambdaFunction.functionName,
            streamProcessorFunctionName: replica.streamProcessingLambda.functionName,
            streamProcessorDlqName: replica.dlq.queueName,
            evidenceProviderTableName: evidenceProviderTable.tableName,
            evidenceSchemaTableName: evidenceSchemaTable.tableName,
            evidenceLedgerName: evidenceLedger.name!,
            evidenceSearchDomain: replica.readReplica.domainName,
            accountNumber: cdk.Stack.of(this).account,
            canaryName,
        });

        // metrics collector
        new SolutionMetricsCollectorConstruct(this, 'solution-metrics-collector', {
            solutionId,
            solutionDisplayName: 'Verifiable Controls Evidence Store',
            sendAnonymousMetrics: this.getCurrentConfig()?.publishOperationalMetrics
                ? 'Yes'
                : 'No',
            version: solutionVersion,
            metricsData: {
                opensearchMasterNodeType:
                    this.getCurrentConfig()?.openSearchMasterNodeInstanceType ??
                    'r5.large.search',
                opensearchDataNodeType:
                    this.getCurrentConfig()?.openSearchMasterNodeInstanceType ??
                    'r5.large.search',
                byoKeys: this.getCurrentConfig()?.customerManagedCMKArns !== undefined,
                useCustomHttpProxy: proxyUri !== undefined,
                dataRemovalPolicy: this.removalPolicy,
            },
        });

        if (this.configuration?.sourceBuckets) {
            // s3 collector
            const s3Collector = new S3EvidenceCollector(this, 's3-collector', {
                service: this,
                attachmentBucket: attachmentBucket.bucket,
                sourceBuckets: this.configuration?.sourceBuckets as any,
                evidenceStoreApi: evidenceApi,
                removalPolicy: this.removalPolicy,
            });

            s3Collector.node.addDependency(agsLambda);
        }
    }

    private setupCMKs() {
        const resolveKey = (
            name: string,
            arn: string,
            additionalPolicyStatement?: iam.PolicyStatement[],
            metadata?: any
        ) =>
            this.importCMK(name, arn) ??
            this.createCMK(name, additionalPolicyStatement, metadata);

        const customerManagedCMKArns = (<unknown>(
            this.getCurrentConfig()?.customerManagedCMKArns
        )) as Record<string, string>;

        this.kmsKeys = {
            evidenceLedger: resolveKey(
                'evidenceLedger',
                customerManagedCMKArns?.evidenceLedger,
                [
                    new iam.PolicyStatement({
                        sid: 'Allow access to principals authorized to use Amazon QLDB',
                        actions: [
                            'kms:CreateGrant',
                            'kms:Decrypt',
                            'kms:Encrypt',
                            'kms:DescribeKey',
                        ],
                        principals: [new iam.AnyPrincipal()],
                        resources: ['*'],
                        conditions: {
                            StringEquals: {
                                'kms:ViaService': `qldb.${
                                    cdk.Stack.of(this).region
                                }.amazonaws.com`,
                                'kms:CallerAccount': cdk.Stack.of(this).account,
                            },
                        },
                    }),
                ],
                {
                    cfn_nag: {
                        rules_to_suppress: [
                            {
                                id: 'F76',
                                reason: 'Key policy as per https://docs.aws.amazon.com/qldb/latest/developerguide/encryption-at-rest.using-cust-keys.html',
                            },
                        ],
                    },
                }
            ),
            evidenceProviderTable: resolveKey(
                'evidenceProviderTable',
                customerManagedCMKArns?.evidenceProviderTable
            ),
            evidenceSchemaTable: resolveKey(
                'evidenceSchemaTable',
                customerManagedCMKArns?.evidenceSchemaTable
            ),
            evidenceContentBucket: resolveKey(
                'evidenceContentBucket',
                customerManagedCMKArns?.evidenceContentBucket
            ),
            replicaStream: resolveKey(
                'replicaStream',
                customerManagedCMKArns?.replicaStream
            ),
            elasticSearch: resolveKey(
                'elasticSearch',
                customerManagedCMKArns?.elasticSearch
            ),
            archiveStream: resolveKey(
                'archiveStream',
                customerManagedCMKArns?.archiveStream
            ),
            archiveBucket: resolveKey(
                'archiveBucket',
                customerManagedCMKArns?.archiveBucket
            ),
            syntheticsCanaryLogBucket: resolveKey(
                'syntheticsCanaryLogBucket',
                customerManagedCMKArns?.syntheticsCanaryLogBucket
            ),
            mainLambda: resolveKey('mainLambda', customerManagedCMKArns?.mainLambda),
            streamProcessor: resolveKey(
                'streamProcessor',
                customerManagedCMKArns?.streamProcessor
            ),
            evidenceAttachmentBucket: resolveKey(
                'evidenceAttachmentBucket',
                customerManagedCMKArns?.evidenceAttachmentBucket
            ),
            streamProcessorDlq: resolveKey(
                'streamProcessorDlq',
                customerManagedCMKArns?.streamProcessorDlq
            ),
        };
    }

    private importCMK(name: string, arn?: string): kms.IKey | null {
        return arn ? kms.Key.fromKeyArn(this, `CMKKey${name}`, arn) : null;
    }

    private createCMK(
        name: string,
        additionalPolicyStatement?: iam.PolicyStatement[],
        metadata?: Record<string, any>
    ): kms.Key {
        const key = new kms.Key(this, `CMKKey${name}`, {
            policy: additionalPolicyStatement
                ? new iam.PolicyDocument({
                      statements: [
                          new iam.PolicyStatement({
                              effect: iam.Effect.ALLOW,
                              actions: ['*'],
                              principals: [new iam.AccountRootPrincipal()],
                              resources: ['*'],
                          }),
                          ...additionalPolicyStatement,
                      ],
                  })
                : undefined,
            description: `KMS Key for ${this.serviceName}/${name}`,
            alias: `${this.serviceName}-${name}`,
            enableKeyRotation: true,
            removalPolicy: this.removalPolicy,
        });

        if (metadata) {
            Object.keys(metadata).forEach((x) =>
                (key.node.defaultChild as kms.CfnKey).addMetadata(x, metadata[x])
            );
        }

        return key;
    }
}
