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

// https://agsweb.auth.ap-southeast-2.amazoncognito.com/login?client_id=7ir5chblhjp9e34hqu7juh0qqt&response_type=code&redirect_uri=https://d2ry2fqaox2h1l.cloudfront.net/index.html

import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CognitoIdentityCustomAttributeMapping } from './cognito-identity-custom-attribute-mapping';
import { Construct } from 'constructs';

export interface CognitoAuthProps {
    domainPrefix: string;
    externalUserRoleArn: string;
    callbackUrl: string;
    logoutUrl: string;
}

export class CognitoAuth extends Construct {
    public readonly clientId: string;
    public readonly signInUrl: string;
    public readonly userPoolId: string;
    public readonly identityPoolId: string;
    public readonly cognitoDomain: string;

    constructor(scope: Construct, id: string, props: CognitoAuthProps) {
        super(scope, id);

        const userPool = new cognito.UserPool(this, 'CognitoUserPool', {
            userPoolName: 'AGSUserPool',
            signInAliases: {
                username: true,
                email: true,
            },
            standardAttributes: {
                fullname: {
                    required: true,
                    mutable: true,
                },
            },
            customAttributes: {
                AGSRoles: new cognito.StringAttribute({ mutable: true }),
            },
        });
        this.userPoolId = userPool.userPoolId;

        const domain = userPool.addDomain('CognitoDomain', {
            cognitoDomain: {
                domainPrefix: props.domainPrefix,
            },
        });
        this.cognitoDomain = `${domain.domainName}.auth.${cdk.Aws.REGION}.amazoncognito.com`;

        const client = userPool.addClient('congnito-auth-client', {
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                },
                scopes: [cognito.OAuthScope.OPENID],
                callbackUrls: [props.callbackUrl],
                logoutUrls: [props.logoutUrl],
            },
            readAttributes: new cognito.ClientAttributes()
                .withStandardAttributes({ fullname: true })
                .withCustomAttributes('AGSRoles'),
        });
        this.clientId = client.userPoolClientId;

        this.signInUrl = domain.signInUrl(client, {
            redirectUri: props.callbackUrl,
        });

        const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
            allowUnauthenticatedIdentities: false,
            allowClassicFlow: false,
            cognitoIdentityProviders: [
                {
                    clientId: this.clientId,
                    providerName: `cognito-idp.${cdk.Aws.REGION}.amazonaws.com/${userPool.userPoolId}`,
                },
            ],
        });
        this.identityPoolId = identityPool.ref;

        new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityRoleAttachment', {
            identityPoolId: identityPool.ref,
            roles: {
                authenticated: props.externalUserRoleArn,
                unauthenticated: props.externalUserRoleArn,
            },
        });

        const attributeMapping = new CognitoIdentityCustomAttributeMapping(
            this,
            'CustomAttributeMapping',
            {
                userPoolId: this.userPoolId,
                identityPoolId: this.identityPoolId,
                attributes: {
                    AGSRoles: 'custom:AGSRoles',
                },
            }
        );
        attributeMapping.node.addDependency(identityPool);
    }
}
