import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as sns from '@aws-cdk/aws-sns';
import * as cdk from '@aws-cdk/core';
import { AgsServiceDashboard } from '.';
export interface AgsServiceAlarmsProps {
    dashboard: AgsServiceDashboard;
    notificationTarget: string[];
    topic?: sns.Topic;
    additionalAlarms?: cloudwatch.Alarm[];
    name?: string;
}
export declare class AgsServiceAlarms extends cdk.Construct {
    dashboard: AgsServiceDashboard;
    topic: sns.Topic;
    constructor(scope: cdk.Construct, id: string, props: AgsServiceAlarmsProps);
    private getTargetTopic;
    createNotificationOnAdditionalAlarms(additionalAlarms?: cloudwatch.Alarm[]): void;
    validateNotificationTarget(notificationTarget: string[]): void;
    private createAlarmsForDashboard;
    private subscribeTeamOnBuildFailure;
}
