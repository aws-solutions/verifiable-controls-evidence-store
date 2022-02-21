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
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { AGSService } from './ags-service';
import { SubnetGroup } from './ags-types';
import { Construct } from 'constructs';

export interface AGSLambdaFunctionProps
    extends Omit<
        lambda.FunctionProps,
        'allowPublicSubnet' | 'role' | 'vpc' | 'vpcSubnets'
    > {
    service: AGSService;
    iamRoleName?: string;
    managedPolicies?: iam.ManagedPolicy[];
    disableDefaultLambdaExecutionPolicy?: boolean;
    subnetGroup?: SubnetGroup;
}

export class AGSLambdaFunction extends Construct {
    public readonly lambdaFunction: lambda.Function;
    public readonly lambdaExecutionRole: iam.Role;

    constructor(scope: Construct, id: string, props: AGSLambdaFunctionProps) {
        super(scope, id);

        const service = props.service;
        const sharedInfraClient = service.sharedInfraClient;

        const subnetGroup = props.subnetGroup ?? SubnetGroup.SERVICE;

        // Add the inline policy to enable lambda to call any other APIs
        // It is only necessary when a service is running in a different account
        // from team shared account and need to call its dependency services across-account
        // This is a wildcard policy as the APIGateway has resource policy to limit the access.
        const allowCrossAccountAPIPolicyDoc = new iam.PolicyDocument({
            statements: [
                iam.PolicyStatement.fromJson({
                    Effect: iam.Effect.ALLOW,
                    Action: 'execute-api:Invoke',
                    Resource: 'arn:aws:execute-api:*:*:*/*/*/*',
                }),
            ],
        });

        const allowSSMParamAccess = new iam.PolicyStatement({
            resources: [
                `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/ags/*`,
            ],
            effect: iam.Effect.ALLOW,
            actions: [
                'ssm:DescribeParameters',
                'ssm:GetParameter',
                'ssm:GetParameterHistory',
                'ssm:GetParameters',
            ],
        });

        let inlinePolicies: Record<string, iam.PolicyDocument> | undefined =
            sharedInfraClient.deploymentOptions.developmentUserRole
                ? {
                      AllowCrossAccountApiPolicy: allowCrossAccountAPIPolicyDoc,
                  }
                : undefined;

        if (props.initialPolicy) {
            const initialPolicyDoc = new iam.PolicyDocument({
                statements: props.initialPolicy,
            });

            if (inlinePolicies) {
                inlinePolicies.CustomPolicy = initialPolicyDoc;
            } else {
                inlinePolicies = {
                    CustomPolicy: initialPolicyDoc,
                };
            }
        }

        // get AGS custom managed Lambda execution policies
        const agsLambdaBasicExecutionPolicy = iam.ManagedPolicy.fromManagedPolicyName(
            this,
            'AGSLambdaBasicExecutionPolicy',
            'AGSLambdaBasicExecutionPolicy'
        );

        const agsLambdaVPCAccessExecutionPolicy = iam.ManagedPolicy.fromManagedPolicyName(
            this,
            'AGSLambdaVPCAccessExecutionPolicy',
            'AGSLambdaVPCAccessExecutionPolicy'
        );

        // compose managed policies
        const managedPolicies =
            props.disableDefaultLambdaExecutionPolicy ?? false
                ? []
                : [
                      sharedInfraClient.vpc
                          ? agsLambdaVPCAccessExecutionPolicy
                          : agsLambdaBasicExecutionPolicy,
                  ];

        if (props.managedPolicies) {
            managedPolicies.push(...props.managedPolicies);
        }

        // One Lambda Function is by default provisioned
        this.lambdaExecutionRole = new iam.Role(this, 'ExecutionRole', {
            ...(props.iamRoleName && { roleName: props.iamRoleName }),
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: `Lambda execution role for ${service.serviceName}-${id}`,
            managedPolicies,
            inlinePolicies: inlinePolicies,
        });
        this.lambdaExecutionRole.addToPolicy(allowSSMParamAccess);

        // tag the lambda execution role with service name (again) for attribute based access control
        cdk.Tags.of(this.lambdaExecutionRole).add('ags:service', service.serviceName);

        // security groups
        const securityGroups = (props.securityGroups ?? []).slice();
        const subnetSecurityGroups =
            sharedInfraClient.getSubnetSecurityGroups(subnetGroup);
        // append subnet security groups
        if (subnetSecurityGroups) {
            securityGroups.push(...subnetSecurityGroups);
        }

        // replace securityGroups in lambda if subnetSecurityGroup is found
        const lambdaProps =
            securityGroups.length === 0 ? props : { ...props, securityGroups };

        this.lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
            ...lambdaProps,
            role: this.lambdaExecutionRole,
            // lambda use optional Customer KMS key as in most of the case,
            // environmentEncryption can use AWS managed Key instead of custoemr KMS Key.
            environmentEncryption: service.getOptionalKMSKey(id),
            vpc: sharedInfraClient.vpc,
            vpcSubnets: sharedInfraClient.getSubnetsByGroupName(subnetGroup),
            tracing: lambda.Tracing.ACTIVE,
        });
    }
}
