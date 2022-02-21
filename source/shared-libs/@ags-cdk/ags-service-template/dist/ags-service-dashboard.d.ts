import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
export interface ApiGatewayWidgetProps {
    apiName: string;
    endpoints: {
        method: string;
        resource: string;
        friendlyName?: string;
    }[];
}
export interface LambdaWidgetProps {
    functionName: string;
    friendlyName?: string;
}
export interface DynamoDbWidgetProps {
    tableName: string;
    friendlyTableName?: string;
}
export interface AgsServiceDashboardProps {
    dashboardName?: string;
    serviceName: string;
    canaryName?: string;
    lambdas: LambdaWidgetProps[];
    apiGateway?: ApiGatewayWidgetProps;
    dynamoDbTables?: DynamoDbWidgetProps[];
    additionalWidgets?: cw.IWidget[];
}
export declare class AgsServiceDashboard extends Construct {
    readonly dashboard: cw.Dashboard;
    keyMetrics: Map<string, cw.IMetric>;
    constructor(scope: Construct, id: string, props: AgsServiceDashboardProps);
    private createLambdaWidgets;
    private createSuccessRateMetrics;
    private createApiWidgets;
    private lambdaWidget;
    private lambdaMetric;
    private createDynamoDbWidgets;
    private ddbMetric;
    private ddbWidget;
    private apiGatewayWidget;
    private apiGatewayMetric;
    private createGraphWidget;
    private createGraphMetric;
}
