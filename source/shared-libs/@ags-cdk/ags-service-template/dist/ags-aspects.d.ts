import * as cdk from 'aws-cdk-lib';
import { IConstruct } from 'constructs';
export declare class PermissionsBoundary implements cdk.IAspect {
    private readonly permissionsBoundaryArn;
    constructor(permissionsBoundaryArn: string);
    visit(node: IConstruct): void;
}
export declare class OptionMethodNoAuth implements cdk.IAspect {
    visit(node: IConstruct): void;
}
