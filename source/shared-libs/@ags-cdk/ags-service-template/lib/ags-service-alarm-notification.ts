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
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as kms from 'aws-cdk-lib/aws-kms';
import { AgsServiceDashboard } from '.';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface AgsServiceAlarmsProps {
    dashboard: AgsServiceDashboard;
    notificationTarget: string[];
    topic?: sns.Topic;
    additionalAlarms?: cloudwatch.Alarm[];
    name?: string;
}

export class AgsServiceAlarms extends Construct {
    public dashboard: AgsServiceDashboard;
    topic: sns.Topic;
    constructor(scope: Construct, id: string, props: AgsServiceAlarmsProps) {
        super(scope, id);
        this.topic = this.getTargetTopic(props);
        this.validateNotificationTarget(props.notificationTarget);
        this.createAlarmsForDashboard(props.dashboard);
        this.createNotificationOnAdditionalAlarms(props.additionalAlarms);
        this.subscribeTeamOnBuildFailure(this.topic, props.notificationTarget);
    }

    private getTargetTopic(props: AgsServiceAlarmsProps): sns.Topic {
        if (props.topic) {
            return props.topic;
        } else {
            const snsEncryptionKey = new kms.Key(this, `sns-encryption-key`, {
                removalPolicy: RemovalPolicy.DESTROY,
                enableKeyRotation: true,
            });

            const topic = new sns.Topic(this, 'OpsAlarmTopic', {
                masterKey: snsEncryptionKey,
            });
            // https://docs.aws.amazon.com/kms/latest/APIReference/API_CreateAlias.html length 256
            const alias = `alarm-${
                props.name ?? 'AgsServiceAlarms'
            }-encryption-key`.substring(0, 256);
            snsEncryptionKey.addAlias(alias);
            return topic;
        }
    }

    createNotificationOnAdditionalAlarms(additionalAlarms?: cloudwatch.Alarm[]): void {
        additionalAlarms?.forEach((alarm) =>
            alarm.addAlarmAction(new cw_actions.SnsAction(this.topic))
        );
    }

    validateNotificationTarget(notificationTarget: string[]): void {
        if (
            notificationTarget.length != 0 &&
            notificationTarget.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        ) {
            throw new Error('Invalid notification target, has to be list of emails');
        }
    }

    private createAlarmsForDashboard(dashboard: AgsServiceDashboard) {
        dashboard.keyMetrics.forEach((metric, name) => {
            const alarm = new cloudwatch.Alarm(this, `alarm-${name}`, {
                metric: metric,
                threshold: 95,
                comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
                evaluationPeriods: 3,
                datapointsToAlarm: 2,
            });
            alarm.addAlarmAction(new cw_actions.SnsAction(this.topic));
        });
    }

    private subscribeTeamOnBuildFailure(topic: sns.Topic, listOfEmails: Array<string>) {
        listOfEmails.forEach((email) =>
            topic.addSubscription(new subs.EmailSubscription(email))
        );
    }
}
