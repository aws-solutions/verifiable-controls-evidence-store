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
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
const baseProps = {
    height: 6,
    width: 6,
    liveData: true,
};

export function createEventBridgeRuleWidget(ruleName: string): cw.IWidget {
    return new cw.GraphWidget({
        ...baseProps,
        title: 'Event Rule Invocations',
        left: [
            new cw.Metric({
                namespace: 'AWS/Events',
                metricName: 'Invocations',
                label: 'Total Invocations',
                statistic: cw.Statistic.SUM,
                unit: cw.Unit.COUNT,
                dimensionsMap: {
                    RuleName: ruleName,
                },
            }),
            new cw.Metric({
                namespace: 'AWS/Events',
                metricName: 'FailedInvocations',
                label: 'Total Failed Invocations',
                statistic: cw.Statistic.SUM,
                unit: cw.Unit.COUNT,
                dimensionsMap: {
                    RuleName: ruleName,
                },
            }),
        ],
    });
}
