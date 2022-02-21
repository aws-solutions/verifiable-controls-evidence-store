import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import { AgsServiceDashboard } from '.';
import { Construct } from 'constructs';
export interface AgsServiceAlarmsProps {
    dashboard: AgsServiceDashboard;
    notificationTarget: string[];
    topic?: sns.Topic;
    additionalAlarms?: cloudwatch.Alarm[];
    name?: string;
}
export declare class AgsServiceAlarms extends Construct {
    dashboard: AgsServiceDashboard;
    topic: sns.Topic;
    constructor(scope: Construct, id: string, props: AgsServiceAlarmsProps);
    private getTargetTopic;
    createNotificationOnAdditionalAlarms(additionalAlarms?: cloudwatch.Alarm[]): void;
    validateNotificationTarget(notificationTarget: string[]): void;
    private createAlarmsForDashboard;
    private subscribeTeamOnBuildFailure;
}
