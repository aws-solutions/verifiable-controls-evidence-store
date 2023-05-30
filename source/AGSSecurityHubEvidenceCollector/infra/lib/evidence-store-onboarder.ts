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
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';

import { AGSSharedInfraClient, SubnetGroup } from '@ags-cdk/ags-service-template';

import { Construct } from 'constructs';

export interface EvidenceOnboarderProps {
    evidenceStoreApi: string;
    evidenceProviderId: string;
    schemaId: string;
    apiKeySecret: secrets.ISecret;
    sharedInfraClient: AGSSharedInfraClient;
}

export class EvidenceStoreOnboarder extends Construct {
    constructor(scope: Construct, id: string, props: EvidenceOnboarderProps) {
        super(scope, id);

        const stack = cdk.Stack.of(this);
        const provider = new EvidenceStoreOnboarderLambda(
            stack,
            'evidence-onboarder-lambda',
            props.apiKeySecret,
            props.sharedInfraClient
        );

        new cdk.CustomResource(this, 'evidence-custom-resource', {
            resourceType: 'Custom::EvidenceOnboarderCustomResource',
            properties: {
                EvidenceStoreUri: props.evidenceStoreApi,
                EvidenceProviderId: props.evidenceProviderId,
                SecretId: props.apiKeySecret.secretName,
                EvidenceSchemaId: props.schemaId,
            },
            serviceToken: provider.provider.serviceToken,
        });
    }
}

class EvidenceStoreOnboarderLambda extends Construct {
    public readonly provider: cr.Provider;

    constructor(
        scope: Construct,
        id: string,
        apiKeySecret: secrets.ISecret,
        sharedInfraClient: AGSSharedInfraClient
    ) {
        super(scope, id);

        const fn = new lambda.SingletonFunction(this, 'evidence-store-onboarder-fn', {
            uuid: 'sec-hub-evidence-onboarder',
            handler: 'index.onEvent',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset(
                path.join(__dirname, './evidence-store-onboarder/dist')
            ),
            timeout: cdk.Duration.minutes(1),
            tracing: lambda.Tracing.ACTIVE,
            architecture: lambda.Architecture.ARM_64,
            vpc: sharedInfraClient.vpc,
            vpcSubnets: sharedInfraClient.getSubnetsByGroupName(SubnetGroup.SERVICE),
        });

        fn.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['execute-api:Invoke'],
                effect: iam.Effect.ALLOW,
                resources: ['arn:aws:execute-api:*:*:*/*/*/*'],
            })
        );

        apiKeySecret.grantWrite(fn);

        this.provider = new cr.Provider(this, 'provider', {
            onEventHandler: fn,
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
    }
}
