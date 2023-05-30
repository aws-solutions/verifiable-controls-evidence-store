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
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';

import { AGSTokenService } from './ags-tokenservice';
import { AGSWebClientStackProps } from './ags-types';
import { CognitoAuth } from './ags-cognito-auth';
import { Construct } from 'constructs';
import { addCfnNagSuppression } from './cfn-nag-suppression';
import { kmsLogGroupPolicyStatement } from './kms-loggroup-policy';

export class AGSWebClientStack extends cdk.Stack {
    public webClientDistributionId: string;
    public webclientBucket: s3.Bucket;
    constructor(scope: Construct, id: string, props: AGSWebClientStackProps) {
        super(scope, id, props);

        const removalPolicy = props.configuration.deploymentOptions.retainData
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY;

        // only create necesssary SSM parameters if web client is not enabled
        // as SSM parameter look-up in CDK will fail the synth if SSM parameter doesn't exist
        // and AGSSharedInfraClient expects those SSM parameters exist
        if (!props.configuration.deploymentOptions.enableWebClient) {
            this.writeSSMParameters('dummy-value', 'dummy-value');
        } else {
            // role ARN
            const externalUserRoleArn = `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/AGSExternalUserRole`;

            // create token service API
            // set auth type to SAML if federated auth is enabled, otherwise use Cognito
            const authType = props.configuration.deploymentOptions.enableFederatedAuth
                ? 'SAML'
                : 'COGNITO';

            const tokenServiceApiUrl = new AGSTokenService(this, 'TokenService', {
                authType,
                identityProvider: props.configuration.identityProvider,
                externalUserRoleArn: externalUserRoleArn,
                allowedExternalIPRanges: props.configuration.allowedExternalIPRanges,
                removalPolicy,
            }).apiUrl;

            // source bucket for web client
            this.webclientBucket = new s3.Bucket(this, 'WebClientBucket', {
                autoDeleteObjects: true,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                versioned: true,
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
                // KMS CMK encryption requires a Lambda@Edge at CloudFront to access the bucket
                // https://aws.amazon.com/blogs/networking-and-content-delivery/serving-sse-kms-encrypted-content-from-s3-using-cloudfront/
                encryption: s3.BucketEncryption.S3_MANAGED,
            });

            addCfnNagSuppression(this.webclientBucket as Construct, [
                {
                    id: 'W35',
                    reason: 'Web client bucket is only read from CloudFront, not necessary for additional logging',
                },
            ]);

            const originAccessIdentity = new cloudfront.OriginAccessIdentity(
                this,
                'webClientOrigin',
                {
                    comment: 'AGS Web Client Origin Access Identity',
                }
            );

            // origin configuration
            const originConfigs: cloudfront.SourceConfiguration[] = [
                {
                    s3OriginSource: {
                        s3BucketSource: this.webclientBucket,
                        originAccessIdentity: originAccessIdentity,
                    },
                    behaviors: [
                        {
                            isDefaultBehavior: true,
                        },
                    ],
                },
            ];

            // parse Token Service API into domain name and stage name
            const apiInfo = tokenServiceApiUrl.match(/^https:\/\/(.*)\/(.*)\/$/);

            if (apiInfo) {
                const tokenServiceOrigin: cloudfront.SourceConfiguration = {
                    customOriginSource: {
                        domainName: apiInfo[1],
                        originPath: `/${apiInfo[2]}`,
                    },
                    behaviors: [
                        {
                            allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
                            cachedMethods:
                                cloudfront.CloudFrontAllowedCachedMethods
                                    .GET_HEAD_OPTIONS,
                            defaultTtl: cdk.Duration.seconds(0),
                            minTtl: cdk.Duration.seconds(0),
                            maxTtl: cdk.Duration.seconds(0),
                            forwardedValues: {
                                queryString: true,
                            },
                            pathPattern: '/acs',
                        },
                    ],
                };
                originConfigs.push(tokenServiceOrigin);
            }

            const securityHeaderFunctionRole = new iam.Role(
                this,
                'SecurityHeaderFunctionRole',
                {
                    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
                    managedPolicies: [
                        iam.ManagedPolicy.fromAwsManagedPolicyName(
                            'service-role/AWSLambdaBasicExecutionRole'
                        ),
                    ],
                }
            );

            securityHeaderFunctionRole.addToPolicy(
                iam.PolicyStatement.fromJson({
                    Effect: 'Allow',
                    Action: ['s3:GetObject'],
                    Resource: [`${this.webclientBucket.bucketArn}/index.html`],
                })
            );

            const securityHeaderFunction = new lambdaNodeJs.NodejsFunction(
                this,
                'SecurityHeaderFunction',
                {
                    runtime: lambda.Runtime.NODEJS_18_X,
                    handler: 'handler',
                    entry: path.join(__dirname, '..', 'lambda/securityHeader/index.ts'),
                    timeout: cdk.Duration.seconds(15),
                    role: securityHeaderFunctionRole,
                    reservedConcurrentExecutions: 2,
                    environment: {
                        BUCKET_NAME: this.webclientBucket.bucketName,
                        OBJECT_KEY: 'index.html',
                    },
                }
            );
            addCfnNagSuppression(securityHeaderFunction, [
                {
                    id: 'W89',
                    reason: 'Security header lambda works with CloudFront and does not need to be in VPC',
                },
                {
                    id: 'W58',
                    reason: 'Lambda already has the required permission to write CloudWatch Logs via arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole.',
                },
            ]);

            const apiPolicyDocument = new iam.PolicyDocument();

            const kmsKey = new kms.Key(this, 'IndexAPIAccessLogKey', {
                enableKeyRotation: true,
                removalPolicy,
            });

            const logGroup = new logs.LogGroup(this, 'IndexAPiAccessLogs', {
                encryptionKey: kmsKey,
                removalPolicy,
            });

            kmsKey.addToResourcePolicy(kmsLogGroupPolicyStatement);

            const indexAPIGateway = new apiGateway.LambdaRestApi(this, 'IndexAPI', {
                handler: securityHeaderFunction,
                endpointConfiguration: {
                    types: [apiGateway.EndpointType.REGIONAL],
                },
                deployOptions: {
                    accessLogDestination: new apiGateway.LogGroupLogDestination(logGroup),
                    accessLogFormat: apiGateway.AccessLogFormat.clf(),
                },
                policy: props.configuration.allowedExternalIPRanges
                    ? apiPolicyDocument
                    : undefined,
            });

            addCfnNagSuppression(indexAPIGateway.deploymentStage as Construct, [
                {
                    id: 'W64',
                    reason: 'Index API provides index.html through CloudFront, no need for usage plan',
                },
            ]);

            addCfnNagSuppression(indexAPIGateway.latestDeployment as Construct, [
                {
                    id: 'W68',
                    reason: 'Index API provides index.html through CloudFront, no need for usage plan',
                },
            ]);

            addCfnNagSuppression(
                indexAPIGateway.root.node.findChild('ANY') as Construct,
                [
                    {
                        id: 'W59',
                        reason: 'Index API method is only accessed from CloudFront and no need for authentication',
                    },
                ]
            );

            addCfnNagSuppression(
                indexAPIGateway.root.node
                    .findChild('{proxy+}')
                    .node.findChild('ANY') as Construct,
                [
                    {
                        id: 'W59',
                        reason: 'Index API method is only accessed from CloudFront and no need for authentication',
                    },
                ]
            );

            if (props.configuration.allowedExternalIPRanges) {
                // Create API Gateway Resource Policy
                apiPolicyDocument.addStatements(
                    iam.PolicyStatement.fromJson({
                        Effect: 'Allow',
                        Principal: '*',
                        Action: 'execute-api:Invoke',
                        Resource: 'execute-api:/*/*/*',
                    })
                );
                apiPolicyDocument.addStatements(
                    iam.PolicyStatement.fromJson({
                        Effect: 'Deny',
                        Principal: '*',
                        Action: 'execute-api:Invoke',
                        Resource: 'execute-api:/*/*/*',
                        Condition: {
                            NotIpAddress: {
                                'aws:SourceIp':
                                    props.configuration.allowedExternalIPRanges
                                        .split(',')
                                        .map((ip) => ip.trim()),
                            },
                        },
                    })
                );

                // ensure a new API deployment occurs when the API policy changes
                indexAPIGateway.latestDeployment?.addToLogicalId(
                    cdk.Token.asAny(apiPolicyDocument)
                );
            }

            const indexOriginConfig: cloudfront.SourceConfiguration = {
                customOriginSource: {
                    domainName: cdk.Fn.select(2, cdk.Fn.split('/', indexAPIGateway.url)),
                    originPath: cdk.Fn.join('/', [
                        '',
                        indexAPIGateway.deploymentStage.stageName,
                    ]),
                },
                behaviors: [
                    {
                        allowedMethods:
                            cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                        cachedMethods:
                            cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                        defaultTtl: cdk.Duration.seconds(0),
                        minTtl: cdk.Duration.seconds(0),
                        maxTtl: cdk.Duration.seconds(0),
                        pathPattern: '/index.html',
                    },
                ],
            };

            originConfigs.push(indexOriginConfig);

            // logging bucket for CloudFront
            const loggingBucket = new s3.Bucket(this, 'LoggingBucket', {
                autoDeleteObjects: true,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                versioned: true,
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
                encryption: s3.BucketEncryption.S3_MANAGED,
                objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
            });

            addCfnNagSuppression(loggingBucket as Construct, [
                {
                    id: 'W35',
                    reason: 'Logging bucket for CloudFront logs',
                },
            ]);

            // web distribution
            const webDistribution = new cloudfront.CloudFrontWebDistribution(
                this,
                'WebClientDistribution',
                {
                    comment: 'AGS Web Client',
                    webACLId: props.configuration.webACLId,
                    originConfigs,
                    defaultRootObject: 'index.html',

                    // specific setting for react SPA
                    errorConfigurations: [
                        {
                            errorCode: 403,
                            errorCachingMinTtl: 0, //temporary no cache
                            responseCode: 200,
                            responsePagePath: '/index.html',
                        },
                        {
                            errorCode: 404,
                            errorCachingMinTtl: 0, //temporary no cache
                            responseCode: 200,
                            responsePagePath: '/index.html',
                        },
                    ],

                    loggingConfig: {
                        bucket: loggingBucket,
                        includeCookies: true,
                        prefix: '',
                    },
                }
            );
            this.webClientDistributionId = webDistribution.distributionId;

            addCfnNagSuppression(webDistribution as Construct, [
                {
                    id: 'W70',
                    reason: 'CloudFront set security policy to TLSv1 regardless of the MinimumProtocolVersion if default CloudFront domain name is used. https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_ViewerCertificate.html',
                },
            ]);

            const webDistributionId = webDistribution.distributionId;
            const webDistributionDomainName = webDistribution.distributionDomainName;
            const webClientBucketS3Url = this.webclientBucket.s3UrlForObject();

            this.writeSSMParameters(webDistributionId, webClientBucketS3Url);

            // output the web client URL
            new cdk.CfnOutput(this, 'webClientOutput', {
                value: webDistributionDomainName,
            });

            // output the web client URL
            new cdk.CfnOutput(this, 'webClientBucketUrlOutput', {
                value: webClientBucketS3Url,
            });

            // setup cognito
            if (!props.configuration.deploymentOptions.enableFederatedAuth) {
                const baseUrl = `https://${webDistribution.distributionDomainName}`;
                const callbackUrl = `${baseUrl}/acs`;
                const logoutUrl = `${baseUrl}/getStarted`;

                const auth = new CognitoAuth(this, 'CognitoAuth', {
                    externalUserRoleArn: externalUserRoleArn,
                    callbackUrl,
                    logoutUrl,
                    removalPolicy,
                });

                // write cognito settings to SSM parameters
                new ssm.StringParameter(this, 'cognitoAuthSignInUrl', {
                    parameterName: '/ags/cognito/signInUrl',
                    stringValue: auth.signInUrl,
                });

                new ssm.StringParameter(this, 'cognitoClientId', {
                    parameterName: '/ags/cognito/clientId',
                    stringValue: auth.clientId,
                });

                new ssm.StringParameter(this, 'cognitoUsserPoolId', {
                    parameterName: '/ags/cognito/userPoolId',
                    stringValue: auth.userPoolId,
                });

                new ssm.StringParameter(this, 'cognitoIdentityPoolId', {
                    parameterName: '/ags/cognito/identityPoolId',
                    stringValue: auth.identityPoolId,
                });

                new ssm.StringParameter(this, 'cognitoDomainName', {
                    parameterName: '/ags/cognito/domainName',
                    stringValue: auth.cognitoDomain,
                });

                new ssm.StringParameter(this, 'cognitoRedirectUri', {
                    parameterName: '/ags/cognito/redirectUri',
                    stringValue: callbackUrl,
                });
            }
        }
    }

    private writeSSMParameters(webDistributionId: string, webClientBucketS3Url: string) {
        // write web client distribution id and domain name to SSM
        new ssm.StringParameter(this, 'webClientDistributionId', {
            parameterName: '/ags/webClientDistributionId',
            stringValue: webDistributionId,
        });

        // write web client source bucket s3 url to SSM
        new ssm.StringParameter(this, 'webClientBucketS3Url', {
            parameterName: '/ags/webClientBucketS3Url',
            stringValue: webClientBucketS3Url,
        });
    }
}
