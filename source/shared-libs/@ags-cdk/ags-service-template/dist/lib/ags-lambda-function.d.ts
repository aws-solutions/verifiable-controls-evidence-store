import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { AGSService } from './ags-service';
import { SubnetGroup } from './ags-types';
export interface AGSLambdaFunctionProps extends Omit<lambda.FunctionProps, 'allowPublicSubnet' | 'role' | 'vpc' | 'vpcSubnets'> {
    service: AGSService;
    iamRoleName?: string;
    managedPolicies?: iam.ManagedPolicy[];
    disableDefaultLambdaExecutionPolicy?: boolean;
    subnetGroup?: SubnetGroup;
}
export declare class AGSLambdaFunction extends cdk.Construct {
    readonly lambdaFunction: lambda.Function;
    readonly lambdaExecutionRole: iam.Role;
    constructor(scope: cdk.Construct, id: string, props: AGSLambdaFunctionProps);
}
