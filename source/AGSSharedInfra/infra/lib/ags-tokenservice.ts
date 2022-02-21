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
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';

import { IdentityProviderInfo } from './ags-types';
import * as path from 'path';
import { Construct } from 'constructs';
import { kmsLogGroupPolicyStatement } from './kms-loggroup-policy';
import { addCfnNagSuppression } from './cfn-nag-suppression';

export type AGSTokenServiceProps = {
    authType: string;
    identityProvider: IdentityProviderInfo;
    externalUserRoleArn: string;
    allowedExternalIPRanges?: string;
    removalPolicy: cdk.RemovalPolicy;
};

export class AGSTokenService extends Construct {
    public readonly apiUrl: string;

    constructor(scope: Construct, id: string, props: AGSTokenServiceProps) {
        super(scope, id);

        const lambdaCodePath =
            props.authType === 'SAML'
                ? path.join(__dirname, '../lambda/tokenService/dist/SamlACS')
                : path.join(__dirname, '../lambda/tokenService/dist/CognitoACS');

        const handlerName =
            props.authType === 'SAML' ? 'SamlACS.handler' : 'CognitoACS.handler';

        const httpMethod = props.authType === 'SAML' ? 'POST' : 'GET';

        // lambdas
        const assetCode = lambda.Code.fromAsset(lambdaCodePath);

        const acsLambda = new lambda.Function(this, 'ACSLambda', {
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: handlerName,
            code: assetCode,
            environment: {
                IDENTITY_PROVIDERS: JSON.stringify([props.identityProvider]),
                AGS_REGION: cdk.Aws.REGION,
                AGS_EXTERNAL_USER_ROLE_ARN: props.externalUserRoleArn,
            },
            reservedConcurrentExecutions: 1,
        });
        addCfnNagSuppression(acsLambda, [
            {
                id: 'W89',
                reason: 'ACS endpoint lambda works with APIGateway and does not need to be in VPC',
            },
            {
                id: 'W58',
                reason: 'Lambda already has the required permission to write CloudWatch Logs via arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole.',
            },
        ]);

        const apiPolicyDocument = new iam.PolicyDocument();

        const kmsKey = new kms.Key(this, 'IndexAPIAccessLogKey', {
            enableKeyRotation: true,
            removalPolicy: props.removalPolicy,
        });

        kmsKey.addToResourcePolicy(kmsLogGroupPolicyStatement);

        const logGroup = new logs.LogGroup(this, 'IndexAPiAccessLogs', {
            encryptionKey: kmsKey,
            removalPolicy: props.removalPolicy,
        });

        // api-gateway integrations
        const api = new apigateway.LambdaRestApi(this, 'TokenService', {
            handler: acsLambda, // this serves as default handler
            proxy: false,
            endpointTypes: [apigateway.EndpointType.REGIONAL],
            deployOptions: {
                accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
                accessLogFormat: apigateway.AccessLogFormat.clf(),
            },
            policy: props.allowedExternalIPRanges ? apiPolicyDocument : undefined,
        });

        api.addUsagePlan('UsagePlan', {
            apiStages: [
                {
                    stage: api.deploymentStage,
                },
            ],
            quota: {
                limit: 10000,
                period: apigateway.Period.DAY,
            },
        });

        if (props.allowedExternalIPRanges) {
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
                            'aws:SourceIp': props.allowedExternalIPRanges
                                .split(',')
                                .map((ip) => ip.trim()),
                        },
                    },
                })
            );

            // ensure a new API deployment occurs when the API policy changes
            api.latestDeployment?.addToLogicalId(cdk.Token.asAny(apiPolicyDocument));
        }

        // resources and integrations
        const tokenEndpoint = api.root.addResource('acs');
        const method = tokenEndpoint.addMethod(
            httpMethod,
            new apigateway.LambdaIntegration(acsLambda)
        );
        addCfnNagSuppression(method, [
            {
                id: 'W59',
                reason: 'Token service endpoint is for authentication and must be accessible without authentication',
            },
        ]);

        this.apiUrl = api.url;
    }
}
