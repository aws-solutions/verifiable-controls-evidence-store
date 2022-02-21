"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgsServiceAlarms = void 0;
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
const cloudwatch = require("aws-cdk-lib/aws-cloudwatch");
const cw_actions = require("aws-cdk-lib/aws-cloudwatch-actions");
const sns = require("aws-cdk-lib/aws-sns");
const subs = require("aws-cdk-lib/aws-sns-subscriptions");
const kms = require("aws-cdk-lib/aws-kms");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
class AgsServiceAlarms extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.topic = this.getTargetTopic(props);
        this.validateNotificationTarget(props.notificationTarget);
        this.createAlarmsForDashboard(props.dashboard);
        this.createNotificationOnAdditionalAlarms(props.additionalAlarms);
        this.subscribeTeamOnBuildFailure(this.topic, props.notificationTarget);
    }
    getTargetTopic(props) {
        var _a;
        if (props.topic) {
            return props.topic;
        }
        else {
            const snsEncryptionKey = new kms.Key(this, `sns-encryption-key`, {
                removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
                enableKeyRotation: true,
            });
            const topic = new sns.Topic(this, 'OpsAlarmTopic', {
                masterKey: snsEncryptionKey,
            });
            // https://docs.aws.amazon.com/kms/latest/APIReference/API_CreateAlias.html length 256
            const alias = `alarm-${(_a = props.name) !== null && _a !== void 0 ? _a : 'AgsServiceAlarms'}-encryption-key`.substring(0, 256);
            snsEncryptionKey.addAlias(alias);
            return topic;
        }
    }
    createNotificationOnAdditionalAlarms(additionalAlarms) {
        additionalAlarms === null || additionalAlarms === void 0 ? void 0 : additionalAlarms.forEach((alarm) => alarm.addAlarmAction(new cw_actions.SnsAction(this.topic)));
    }
    validateNotificationTarget(notificationTarget) {
        if (notificationTarget.length != 0 &&
            notificationTarget.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
            throw new Error('Invalid notification target, has to be list of emails');
        }
    }
    createAlarmsForDashboard(dashboard) {
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
    subscribeTeamOnBuildFailure(topic, listOfEmails) {
        listOfEmails.forEach((email) => topic.addSubscription(new subs.EmailSubscription(email)));
    }
}
exports.AgsServiceAlarms = AgsServiceAlarms;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlcnZpY2UtYWxhcm0tbm90aWZpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2Fncy1zZXJ2aWNlLWFsYXJtLW5vdGlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7RUFjRTtBQUNGLHlEQUF5RDtBQUN6RCxpRUFBaUU7QUFDakUsMkNBQTJDO0FBQzNDLDBEQUEwRDtBQUMxRCwyQ0FBMkM7QUFFM0MsNkNBQTRDO0FBQzVDLDJDQUF1QztBQVV2QyxNQUFhLGdCQUFpQixTQUFRLHNCQUFTO0lBRzNDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBNEI7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFTyxjQUFjLENBQUMsS0FBNEI7O1FBQy9DLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtZQUNiLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQztTQUN0QjthQUFNO1lBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO2dCQUM3RCxhQUFhLEVBQUUsMkJBQWEsQ0FBQyxPQUFPO2dCQUNwQyxpQkFBaUIsRUFBRSxJQUFJO2FBQzFCLENBQUMsQ0FBQztZQUVILE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO2dCQUMvQyxTQUFTLEVBQUUsZ0JBQWdCO2FBQzlCLENBQUMsQ0FBQztZQUNILHNGQUFzRjtZQUN0RixNQUFNLEtBQUssR0FBRyxTQUNWLE1BQUEsS0FBSyxDQUFDLElBQUksbUNBQUksa0JBQ2xCLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDcEMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sS0FBSyxDQUFDO1NBQ2hCO0lBQ0wsQ0FBQztJQUVELG9DQUFvQyxDQUFDLGdCQUFxQztRQUN0RSxnQkFBZ0IsYUFBaEIsZ0JBQWdCLHVCQUFoQixnQkFBZ0IsQ0FBRSxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUNoQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFDNUQ7SUFDTixDQUFDO0lBRUQsMEJBQTBCLENBQUMsa0JBQTRCO1FBQ25ELElBQ0ksa0JBQWtCLENBQUMsTUFBTSxJQUFJLENBQUM7WUFDOUIsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUMvRTtZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztTQUM1RTtJQUNMLENBQUM7SUFFTyx3QkFBd0IsQ0FBQyxTQUE4QjtRQUMzRCxTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUMxQyxNQUFNLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3RELE1BQU0sRUFBRSxNQUFNO2dCQUNkLFNBQVMsRUFBRSxFQUFFO2dCQUNiLGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUI7Z0JBQ3JFLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3BCLGlCQUFpQixFQUFFLENBQUM7YUFDdkIsQ0FBQyxDQUFDO1lBQ0gsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sMkJBQTJCLENBQUMsS0FBZ0IsRUFBRSxZQUEyQjtRQUM3RSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FDM0IsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUMzRCxDQUFDO0lBQ04sQ0FBQztDQUNKO0FBbEVELDRDQWtFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIFxuICBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgXG4gIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIikuXG4gIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gIFxuICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gIFxuICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBjd19hY3Rpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0ICogYXMgc3VicyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnO1xuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuaW1wb3J0IHsgQWdzU2VydmljZURhc2hib2FyZCB9IGZyb20gJy4nO1xuaW1wb3J0IHsgUmVtb3ZhbFBvbGljeSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFnc1NlcnZpY2VBbGFybXNQcm9wcyB7XG4gICAgZGFzaGJvYXJkOiBBZ3NTZXJ2aWNlRGFzaGJvYXJkO1xuICAgIG5vdGlmaWNhdGlvblRhcmdldDogc3RyaW5nW107XG4gICAgdG9waWM/OiBzbnMuVG9waWM7XG4gICAgYWRkaXRpb25hbEFsYXJtcz86IGNsb3Vkd2F0Y2guQWxhcm1bXTtcbiAgICBuYW1lPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQWdzU2VydmljZUFsYXJtcyBleHRlbmRzIENvbnN0cnVjdCB7XG4gICAgcHVibGljIGRhc2hib2FyZDogQWdzU2VydmljZURhc2hib2FyZDtcbiAgICB0b3BpYzogc25zLlRvcGljO1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBZ3NTZXJ2aWNlQWxhcm1zUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcbiAgICAgICAgdGhpcy50b3BpYyA9IHRoaXMuZ2V0VGFyZ2V0VG9waWMocHJvcHMpO1xuICAgICAgICB0aGlzLnZhbGlkYXRlTm90aWZpY2F0aW9uVGFyZ2V0KHByb3BzLm5vdGlmaWNhdGlvblRhcmdldCk7XG4gICAgICAgIHRoaXMuY3JlYXRlQWxhcm1zRm9yRGFzaGJvYXJkKHByb3BzLmRhc2hib2FyZCk7XG4gICAgICAgIHRoaXMuY3JlYXRlTm90aWZpY2F0aW9uT25BZGRpdGlvbmFsQWxhcm1zKHByb3BzLmFkZGl0aW9uYWxBbGFybXMpO1xuICAgICAgICB0aGlzLnN1YnNjcmliZVRlYW1PbkJ1aWxkRmFpbHVyZSh0aGlzLnRvcGljLCBwcm9wcy5ub3RpZmljYXRpb25UYXJnZXQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0VGFyZ2V0VG9waWMocHJvcHM6IEFnc1NlcnZpY2VBbGFybXNQcm9wcyk6IHNucy5Ub3BpYyB7XG4gICAgICAgIGlmIChwcm9wcy50b3BpYykge1xuICAgICAgICAgICAgcmV0dXJuIHByb3BzLnRvcGljO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc25zRW5jcnlwdGlvbktleSA9IG5ldyBrbXMuS2V5KHRoaXMsIGBzbnMtZW5jcnlwdGlvbi1rZXlgLCB7XG4gICAgICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgICAgICAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnT3BzQWxhcm1Ub3BpYycsIHtcbiAgICAgICAgICAgICAgICBtYXN0ZXJLZXk6IHNuc0VuY3J5cHRpb25LZXksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9rbXMvbGF0ZXN0L0FQSVJlZmVyZW5jZS9BUElfQ3JlYXRlQWxpYXMuaHRtbCBsZW5ndGggMjU2XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGBhbGFybS0ke1xuICAgICAgICAgICAgICAgIHByb3BzLm5hbWUgPz8gJ0Fnc1NlcnZpY2VBbGFybXMnXG4gICAgICAgICAgICB9LWVuY3J5cHRpb24ta2V5YC5zdWJzdHJpbmcoMCwgMjU2KTtcbiAgICAgICAgICAgIHNuc0VuY3J5cHRpb25LZXkuYWRkQWxpYXMoYWxpYXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRvcGljO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY3JlYXRlTm90aWZpY2F0aW9uT25BZGRpdGlvbmFsQWxhcm1zKGFkZGl0aW9uYWxBbGFybXM/OiBjbG91ZHdhdGNoLkFsYXJtW10pOiB2b2lkIHtcbiAgICAgICAgYWRkaXRpb25hbEFsYXJtcz8uZm9yRWFjaCgoYWxhcm0pID0+XG4gICAgICAgICAgICBhbGFybS5hZGRBbGFybUFjdGlvbihuZXcgY3dfYWN0aW9ucy5TbnNBY3Rpb24odGhpcy50b3BpYykpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgdmFsaWRhdGVOb3RpZmljYXRpb25UYXJnZXQobm90aWZpY2F0aW9uVGFyZ2V0OiBzdHJpbmdbXSk6IHZvaWQge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBub3RpZmljYXRpb25UYXJnZXQubGVuZ3RoICE9IDAgJiZcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvblRhcmdldC5zb21lKChlbWFpbCkgPT4gIS9eW15cXHNAXStAW15cXHNAXStcXC5bXlxcc0BdKyQvLnRlc3QoZW1haWwpKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub3RpZmljYXRpb24gdGFyZ2V0LCBoYXMgdG8gYmUgbGlzdCBvZiBlbWFpbHMnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgY3JlYXRlQWxhcm1zRm9yRGFzaGJvYXJkKGRhc2hib2FyZDogQWdzU2VydmljZURhc2hib2FyZCkge1xuICAgICAgICBkYXNoYm9hcmQua2V5TWV0cmljcy5mb3JFYWNoKChtZXRyaWMsIG5hbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgYGFsYXJtLSR7bmFtZX1gLCB7XG4gICAgICAgICAgICAgICAgbWV0cmljOiBtZXRyaWMsXG4gICAgICAgICAgICAgICAgdGhyZXNob2xkOiA5NSxcbiAgICAgICAgICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6IGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkxFU1NfVEhBTl9USFJFU0hPTEQsXG4gICAgICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDMsXG4gICAgICAgICAgICAgICAgZGF0YXBvaW50c1RvQWxhcm06IDIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjd19hY3Rpb25zLlNuc0FjdGlvbih0aGlzLnRvcGljKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3Vic2NyaWJlVGVhbU9uQnVpbGRGYWlsdXJlKHRvcGljOiBzbnMuVG9waWMsIGxpc3RPZkVtYWlsczogQXJyYXk8c3RyaW5nPikge1xuICAgICAgICBsaXN0T2ZFbWFpbHMuZm9yRWFjaCgoZW1haWwpID0+XG4gICAgICAgICAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IHN1YnMuRW1haWxTdWJzY3JpcHRpb24oZW1haWwpKVxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==