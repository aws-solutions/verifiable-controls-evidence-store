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
const cloudwatch = require("@aws-cdk/aws-cloudwatch");
const cw_actions = require("@aws-cdk/aws-cloudwatch-actions");
const sns = require("@aws-cdk/aws-sns");
const subs = require("@aws-cdk/aws-sns-subscriptions");
const cdk = require("@aws-cdk/core");
const kms = require("@aws-cdk/aws-kms");
const core_1 = require("@aws-cdk/core");
class AgsServiceAlarms extends cdk.Construct {
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
                removalPolicy: core_1.RemovalPolicy.DESTROY,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlcnZpY2UtYWxhcm0tbm90aWZpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2Fncy1zZXJ2aWNlLWFsYXJtLW5vdGlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7RUFjRTtBQUNGLHNEQUFzRDtBQUN0RCw4REFBOEQ7QUFDOUQsd0NBQXdDO0FBQ3hDLHVEQUF1RDtBQUN2RCxxQ0FBcUM7QUFDckMsd0NBQXdDO0FBRXhDLHdDQUE4QztBQVU5QyxNQUFhLGdCQUFpQixTQUFRLEdBQUcsQ0FBQyxTQUFTO0lBRy9DLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBNEI7UUFDdEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFTyxjQUFjLENBQUMsS0FBNEI7O1FBQy9DLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtZQUNiLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQztTQUN0QjthQUFNO1lBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO2dCQUM3RCxhQUFhLEVBQUUsb0JBQWEsQ0FBQyxPQUFPO2dCQUNwQyxpQkFBaUIsRUFBRSxJQUFJO2FBQzFCLENBQUMsQ0FBQztZQUVILE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO2dCQUMvQyxTQUFTLEVBQUUsZ0JBQWdCO2FBQzlCLENBQUMsQ0FBQztZQUNILHNGQUFzRjtZQUN0RixNQUFNLEtBQUssR0FBRyxTQUNWLE1BQUEsS0FBSyxDQUFDLElBQUksbUNBQUksa0JBQ2xCLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDcEMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sS0FBSyxDQUFDO1NBQ2hCO0lBQ0wsQ0FBQztJQUVELG9DQUFvQyxDQUFDLGdCQUFxQztRQUN0RSxnQkFBZ0IsYUFBaEIsZ0JBQWdCLHVCQUFoQixnQkFBZ0IsQ0FBRSxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUNoQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFDNUQ7SUFDTixDQUFDO0lBRUQsMEJBQTBCLENBQUMsa0JBQTRCO1FBQ25ELElBQ0ksa0JBQWtCLENBQUMsTUFBTSxJQUFJLENBQUM7WUFDOUIsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUMvRTtZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztTQUM1RTtJQUNMLENBQUM7SUFFTyx3QkFBd0IsQ0FBQyxTQUE4QjtRQUMzRCxTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUMxQyxNQUFNLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3RELE1BQU0sRUFBRSxNQUFNO2dCQUNkLFNBQVMsRUFBRSxFQUFFO2dCQUNiLGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUI7Z0JBQ3JFLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3BCLGlCQUFpQixFQUFFLENBQUM7YUFDdkIsQ0FBQyxDQUFDO1lBQ0gsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sMkJBQTJCLENBQUMsS0FBZ0IsRUFBRSxZQUEyQjtRQUM3RSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FDM0IsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUMzRCxDQUFDO0lBQ04sQ0FBQztDQUNKO0FBbEVELDRDQWtFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIFxuICBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgXG4gIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIikuXG4gIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gIFxuICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gIFxuICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBjd19hY3Rpb25zIGZyb20gJ0Bhd3MtY2RrL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ0Bhd3MtY2RrL2F3cy1zbnMnO1xuaW1wb3J0ICogYXMgc3VicyBmcm9tICdAYXdzLWNkay9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMga21zIGZyb20gJ0Bhd3MtY2RrL2F3cy1rbXMnO1xuaW1wb3J0IHsgQWdzU2VydmljZURhc2hib2FyZCB9IGZyb20gJy4nO1xuaW1wb3J0IHsgUmVtb3ZhbFBvbGljeSB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFnc1NlcnZpY2VBbGFybXNQcm9wcyB7XG4gICAgZGFzaGJvYXJkOiBBZ3NTZXJ2aWNlRGFzaGJvYXJkO1xuICAgIG5vdGlmaWNhdGlvblRhcmdldDogc3RyaW5nW107XG4gICAgdG9waWM/OiBzbnMuVG9waWM7XG4gICAgYWRkaXRpb25hbEFsYXJtcz86IGNsb3Vkd2F0Y2guQWxhcm1bXTtcbiAgICBuYW1lPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQWdzU2VydmljZUFsYXJtcyBleHRlbmRzIGNkay5Db25zdHJ1Y3Qge1xuICAgIHB1YmxpYyBkYXNoYm9hcmQ6IEFnc1NlcnZpY2VEYXNoYm9hcmQ7XG4gICAgdG9waWM6IHNucy5Ub3BpYztcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFnc1NlcnZpY2VBbGFybXNQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpO1xuICAgICAgICB0aGlzLnRvcGljID0gdGhpcy5nZXRUYXJnZXRUb3BpYyhwcm9wcyk7XG4gICAgICAgIHRoaXMudmFsaWRhdGVOb3RpZmljYXRpb25UYXJnZXQocHJvcHMubm90aWZpY2F0aW9uVGFyZ2V0KTtcbiAgICAgICAgdGhpcy5jcmVhdGVBbGFybXNGb3JEYXNoYm9hcmQocHJvcHMuZGFzaGJvYXJkKTtcbiAgICAgICAgdGhpcy5jcmVhdGVOb3RpZmljYXRpb25PbkFkZGl0aW9uYWxBbGFybXMocHJvcHMuYWRkaXRpb25hbEFsYXJtcyk7XG4gICAgICAgIHRoaXMuc3Vic2NyaWJlVGVhbU9uQnVpbGRGYWlsdXJlKHRoaXMudG9waWMsIHByb3BzLm5vdGlmaWNhdGlvblRhcmdldCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRUYXJnZXRUb3BpYyhwcm9wczogQWdzU2VydmljZUFsYXJtc1Byb3BzKTogc25zLlRvcGljIHtcbiAgICAgICAgaWYgKHByb3BzLnRvcGljKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvcHMudG9waWM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzbnNFbmNyeXB0aW9uS2V5ID0gbmV3IGttcy5LZXkodGhpcywgYHNucy1lbmNyeXB0aW9uLWtleWAsIHtcbiAgICAgICAgICAgICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICAgICAgICAgICAgZW5hYmxlS2V5Um90YXRpb246IHRydWUsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgdG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdPcHNBbGFybVRvcGljJywge1xuICAgICAgICAgICAgICAgIG1hc3RlcktleTogc25zRW5jcnlwdGlvbktleSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2ttcy9sYXRlc3QvQVBJUmVmZXJlbmNlL0FQSV9DcmVhdGVBbGlhcy5odG1sIGxlbmd0aCAyNTZcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYGFsYXJtLSR7XG4gICAgICAgICAgICAgICAgcHJvcHMubmFtZSA/PyAnQWdzU2VydmljZUFsYXJtcydcbiAgICAgICAgICAgIH0tZW5jcnlwdGlvbi1rZXlgLnN1YnN0cmluZygwLCAyNTYpO1xuICAgICAgICAgICAgc25zRW5jcnlwdGlvbktleS5hZGRBbGlhcyhhbGlhcyk7XG4gICAgICAgICAgICByZXR1cm4gdG9waWM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjcmVhdGVOb3RpZmljYXRpb25PbkFkZGl0aW9uYWxBbGFybXMoYWRkaXRpb25hbEFsYXJtcz86IGNsb3Vkd2F0Y2guQWxhcm1bXSk6IHZvaWQge1xuICAgICAgICBhZGRpdGlvbmFsQWxhcm1zPy5mb3JFYWNoKChhbGFybSkgPT5cbiAgICAgICAgICAgIGFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBjd19hY3Rpb25zLlNuc0FjdGlvbih0aGlzLnRvcGljKSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICB2YWxpZGF0ZU5vdGlmaWNhdGlvblRhcmdldChub3RpZmljYXRpb25UYXJnZXQ6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvblRhcmdldC5sZW5ndGggIT0gMCAmJlxuICAgICAgICAgICAgbm90aWZpY2F0aW9uVGFyZ2V0LnNvbWUoKGVtYWlsKSA9PiAhL15bXlxcc0BdK0BbXlxcc0BdK1xcLlteXFxzQF0rJC8udGVzdChlbWFpbCkpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vdGlmaWNhdGlvbiB0YXJnZXQsIGhhcyB0byBiZSBsaXN0IG9mIGVtYWlscycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVBbGFybXNGb3JEYXNoYm9hcmQoZGFzaGJvYXJkOiBBZ3NTZXJ2aWNlRGFzaGJvYXJkKSB7XG4gICAgICAgIGRhc2hib2FyZC5rZXlNZXRyaWNzLmZvckVhY2goKG1ldHJpYywgbmFtZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBgYWxhcm0tJHtuYW1lfWAsIHtcbiAgICAgICAgICAgICAgICBtZXRyaWM6IG1ldHJpYyxcbiAgICAgICAgICAgICAgICB0aHJlc2hvbGQ6IDk1LFxuICAgICAgICAgICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuTEVTU19USEFOX1RIUkVTSE9MRCxcbiAgICAgICAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMyxcbiAgICAgICAgICAgICAgICBkYXRhcG9pbnRzVG9BbGFybTogMixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYWxhcm0uYWRkQWxhcm1BY3Rpb24obmV3IGN3X2FjdGlvbnMuU25zQWN0aW9uKHRoaXMudG9waWMpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdWJzY3JpYmVUZWFtT25CdWlsZEZhaWx1cmUodG9waWM6IHNucy5Ub3BpYywgbGlzdE9mRW1haWxzOiBBcnJheTxzdHJpbmc+KSB7XG4gICAgICAgIGxpc3RPZkVtYWlscy5mb3JFYWNoKChlbWFpbCkgPT5cbiAgICAgICAgICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgc3Vicy5FbWFpbFN1YnNjcmlwdGlvbihlbWFpbCkpXG4gICAgICAgICk7XG4gICAgfVxufVxuIl19