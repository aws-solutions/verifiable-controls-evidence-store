import { Construct } from 'constructs';
import { IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
export interface SolutionMetricsCollectorConstructProps {
    solutionDisplayName: string;
    solutionId: string;
    version: string;
    sendAnonymousMetrics: 'Yes' | 'No';
    vpc?: IVpc;
    vpcSubnets?: SubnetSelection;
    metricsData: {
        [key: string]: unknown;
    };
}
export declare class SolutionMetricsCollectorConstruct extends Construct {
    readonly anonymousDataUUID: string;
    constructor(scope: Construct, id: string, props: SolutionMetricsCollectorConstructProps);
}
