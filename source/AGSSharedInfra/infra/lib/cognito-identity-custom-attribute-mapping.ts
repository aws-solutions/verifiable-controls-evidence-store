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
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Construct } from 'constructs';

export interface CognitoIdentityCustomAttributeMappingProps {
    userPoolId: string;
    identityPoolId: string;
    attributes: Record<string, string>;
}

export class CognitoIdentityCustomAttributeMapping extends Construct {
    private customProviderRole: iam.Role;
    private customProvider: cr.Provider;
    private customResource: cdk.CustomResource;
    constructor(
        scope: Construct,
        id: string,
        props: CognitoIdentityCustomAttributeMappingProps
    ) {
        super(scope, id);

        if (!props.identityPoolId) {
            throw new Error('Identity Pool Id must be specified.');
        }

        if (!props.userPoolId) {
            throw new Error('Cognito User Pool Id must be specified.');
        }

        // policy allow update cloudfront and update iam roles
        const customOUPolicy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'cognito-identity:SetPrincipalTagAttributeMap',
                        'cognito-identity:GetPrincipalTagAttributeMap',
                    ],
                    resources: [
                        `arn:${cdk.Aws.PARTITION}:cognito-identity:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:identitypool/${props.identityPoolId}`,
                    ],
                }),
            ],
        });

        this.customProviderRole = new iam.Role(this, 'customProviderLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromManagedPolicyArn(
                    this,
                    'basicExecutionRole',
                    'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
                ),
            ],

            inlinePolicies: {
                customOUPolicy: customOUPolicy,
            },
        });

        this.customProvider = new cr.Provider(this, 'customProvider', {
            onEventHandler: new lambda.Function(this, 'customerProvierLambda', {
                runtime: lambda.Runtime.NODEJS_16_X,
                handler: 'index.handler',
                code: lambda.Code.fromInline(lambdaCode),
                role: this.customProviderRole,
                timeout: cdk.Duration.minutes(5),
            }),
        });

        this.customResource = new cdk.CustomResource(this, 'customResource', {
            serviceToken: this.customProvider.serviceToken,
            properties: {
                identityPoolId: props.identityPoolId,
                identityProviderName: `cognito-idp.${cdk.Aws.REGION}.amazonaws.com/${props.userPoolId}`,
                attributes: props.attributes,
            },
        });
    }
}

const lambdaCode = `
const AWS = require('aws-sdk');

async function handleUpdate(event) {
    const identityPoolId = event.ResourceProperties.identityPoolId;
    const identityProviderName = event.ResourceProperties.identityProviderName;
    const attributes = event.ResourceProperties.attributes;

    const identity = new AWS.CognitoIdentity({apiVersion: '2014-06-30'});
    return identity.setPrincipalTagAttributeMap({
        IdentityPoolId: identityPoolId,
        IdentityProviderName: identityProviderName,
        PrincipalTags: attributes,
        UseDefaults: false
    }).promise()
}

exports.handler = async function (event, context) {
    const resourceProps = event.ResourceProperties;
    const requestType = event.RequestType;

    let physicalId = 'CustomAttributeMapping:'+resourceProps.identityPoolId;   
    switch (requestType) {
        case 'Create':
        case 'Update':
            await handleUpdate(event, false);
            break;
        case 'Delete':
            break;
    }

    return {
        PhysicalResourceId: physicalId,
    };
};
`;
