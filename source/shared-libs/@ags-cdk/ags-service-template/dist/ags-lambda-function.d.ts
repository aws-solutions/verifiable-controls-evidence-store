import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { AGSService } from './ags-service';
import { SubnetGroup } from './ags-types';
import { Construct } from 'constructs';
export interface AGSLambdaFunctionProps extends Omit<lambda.FunctionProps, 'allowPublicSubnet' | 'role' | 'vpc' | 'vpcSubnets'> {
    service: AGSService;
    iamRoleName?: string;
    managedPolicies?: iam.ManagedPolicy[];
    disableDefaultLambdaExecutionPolicy?: boolean;
    subnetGroup?: SubnetGroup;
}
export declare class AGSLambdaFunction extends Construct {
    readonly lambdaFunction: lambda.Function;
    readonly lambdaExecutionRole: iam.Role;
    constructor(scope: Construct, id: string, props: AGSLambdaFunctionProps);
}
