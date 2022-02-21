import * as cdk from '@aws-cdk/core';
export declare class PermissionsBoundary implements cdk.IAspect {
    private readonly permissionsBoundaryArn;
    constructor(permissionsBoundaryArn: string);
    visit(node: cdk.IConstruct): void;
}
export declare class OptionMethodNoAuth implements cdk.IAspect {
    visit(node: cdk.IConstruct): void;
}
