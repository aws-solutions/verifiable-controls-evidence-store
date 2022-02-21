import { Construct } from 'constructs';
export interface SolutionMetricsCollectorConstructProps {
    solutionDisplayName: string;
    solutionId: string;
    metricEndpoint?: string;
    version: string;
    sendAnonymousMetric: 'Yes' | 'No';
    metricsData: {
        [key: string]: unknown;
    };
}
export declare class SolutionMetricsCollectorConstruct extends Construct {
    constructor(scope: Construct, id: string, props: SolutionMetricsCollectorConstructProps);
}
