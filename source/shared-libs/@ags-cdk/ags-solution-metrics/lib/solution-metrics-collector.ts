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
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CustomResource } from 'aws-cdk-lib';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';

export interface SolutionMetricsCollectorConstructProps {
    solutionDisplayName: string;
    solutionId: string;
    version: string;
    sendAnonymousMetrics: 'Yes' | 'No';
    vpc?: IVpc;
    vpcSubnets?: SubnetSelection;
    metricsData: { [key: string]: unknown };
}

export class SolutionMetricsCollectorConstruct extends Construct {
    public readonly anonymousDataUUID: string;

    constructor(
        scope: Construct,
        id: string,
        props: SolutionMetricsCollectorConstructProps
    ) {
        super(scope, id);

        const metricsCollectorLambda = new lambda.Function(
            this,
            'MetricsCollectorFunction',
            {
                description: `${props.solutionDisplayName} (${props.version}): metrics collection function`,
                runtime: lambda.Runtime.NODEJS_14_X,
                code: lambda.Code.fromAsset(path.resolve(__dirname, './lambda')),
                handler: 'index.handler',
                ...(props.vpc && { vpc: props.vpc }),
                ...(props.vpcSubnets && { vpcSubnets: props.vpcSubnets }),
            }
        );

        const metricsCollectorCrProvider = new cr.Provider(
            this,
            'MetricsCollectorCrProvider',
            {
                onEventHandler: metricsCollectorLambda,
            }
        );

        const customResource = new CustomResource(this, 'CustomResource', {
            serviceToken: metricsCollectorCrProvider.serviceToken,
            properties: {
                solutionId: props.solutionId,
                solutionVersion: props.version,
                region: cdk.Aws.REGION,
                sendAnonymousMetrics: props.sendAnonymousMetrics,
                ...props.metricsData,
            },
        });

        this.anonymousDataUUID = customResource.getAttString('anonymousDataUUID');
    }
}
