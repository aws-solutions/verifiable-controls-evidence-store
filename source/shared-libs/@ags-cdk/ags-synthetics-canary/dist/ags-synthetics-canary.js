"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGSSyntheticsCanary = void 0;
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
const ags_service_template_1 = require("@ags-cdk/ags-service-template");
const aws_cloudwatch_1 = require("aws-cdk-lib/aws-cloudwatch");
const events = require("aws-cdk-lib/aws-events");
const targets = require("aws-cdk-lib/aws-events-targets");
const iam = require("aws-cdk-lib/aws-iam");
const sns = require("aws-cdk-lib/aws-sns");
const synthetics = require("@aws-cdk/aws-synthetics-alpha");
const cdk = require("aws-cdk-lib");
const cfnSynthetics = require("aws-cdk-lib/aws-synthetics");
const constructs_1 = require("constructs");
const canaryNameReg = /^[0-9a-z_-]+$/;
class AGSSyntheticsCanary extends constructs_1.Construct {
    constructor(scope, id, props) {
        var _a, _b, _c, _d, _e, _f, _g;
        super(scope, id);
        if (props.canaryName.length > 21) {
            throw 'Canary name must be less than 21 characters in length.';
        }
        if (!canaryNameReg.test(props.canaryName)) {
            throw `Invalid canary name, must match /^[0-9a-z_-]+$/`;
        }
        this.canaryName = props.canaryName;
        const removePolicy = (_a = props.removalPolicy) !== null && _a !== void 0 ? _a : cdk.RemovalPolicy.DESTROY;
        // create canary artifacts bucket
        const artifactsBucket = (props === null || props === void 0 ? void 0 : props.canaryLogBucket) ? props.canaryLogBucket
            : new ags_service_template_1.AgsSecureBucket(this, 'CanaryArtifactBucket', {
                autoDeleteObjects: removePolicy === cdk.RemovalPolicy.DESTROY,
                removalPolicy: removePolicy,
                encryptionKeyArn: props.s3BucketEncryptionKeyArn,
            }).bucket;
        const prefix = props.s3BucketPrefix || '';
        // create canary execution role
        this.canaryRole = new iam.Role(this, `CanaryExecutionRole`, {
            assumedBy: new iam.ServicePrincipal('lambda'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                // must to have this one for lambda to run in VPC
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
            ],
            inlinePolicies: {
                CanaryPolicy: this.getCanaryRolePolicyDoc(artifactsBucket, prefix),
            },
            description: 'Execution Role for CloudWatch Synthetics Canary',
        });
        // put canary in VPC if apigateway is configured as private
        const sharedInfraVpcConfig = props.sharedInfraClient
            ? props.sharedInfraClient.deploymentOptions.apiGatewayType === 'private'
                ? {
                    vpcId: props.sharedInfraClient.vpc.vpcId,
                    subnetIds: props.sharedInfraClient.vpc.selectSubnets(props.sharedInfraClient.getSubnetsByGroupName(ags_service_template_1.SubnetGroup.SERVICE)).subnetIds,
                    securityGroupIds: ((_b = props.sharedInfraClient
                        .getSubnetSecurityGroups(ags_service_template_1.SubnetGroup.SERVICE)) === null || _b === void 0 ? void 0 : _b.map((securityGroup) => securityGroup.securityGroupId)) ||
                        [],
                }
                : undefined
            : undefined;
        const vpcConfig = (_c = props.vpcConfig) !== null && _c !== void 0 ? _c : sharedInfraVpcConfig;
        const scheduleExpressString = (_e = (_d = props.schedule) === null || _d === void 0 ? void 0 : _d.expressionString) !== null && _e !== void 0 ? _e : 'rate(5 minutes)';
        // create synthetics canary
        new cfnSynthetics.CfnCanary(this, 'Canary', {
            artifactS3Location: artifactsBucket.s3UrlForObject(prefix),
            executionRoleArn: this.canaryRole.roleArn,
            runtimeVersion: props.runtime.name,
            name: props.canaryName,
            schedule: {
                expression: scheduleExpressString,
            },
            startCanaryAfterCreation: (_f = props.startAfterCreation) !== null && _f !== void 0 ? _f : true,
            code: this.createCode(props.test),
            runConfig: {
                activeTracing: true,
                timeoutInSeconds: (_g = props.timeoutInSeconds) !== null && _g !== void 0 ? _g : 15,
                environmentVariables: props.environmentVariables,
            },
            vpcConfig,
            failureRetentionPeriod: props.failureLogRetentionPeriod,
            successRetentionPeriod: props.successLogRetentionPeriod,
        });
        // create cloudwatch event rule to send failed alert to SNS topic
        if (props.alertSNSTopicArn) {
            const alertTopic = sns.Topic.fromTopicArn(this, 'CanaryAlertSNSTopic', props.alertSNSTopicArn);
            new events.Rule(this, 'CanaryTestEventRule', {
                description: 'Event rule for monitoring Canary Test Results',
                eventPattern: {
                    source: ['aws.synthetics'],
                    detailType: ['Synthetics Canary TestRun Failure'],
                    detail: {
                        'canary-name': [props.canaryName],
                        'test-run-status': ['FAILED'],
                    },
                },
                targets: [
                    new targets.SnsTopic(alertTopic, {
                        message: events.RuleTargetInput.fromText(`Canary test ${props.canaryName} failed on in account ${cdk.Aws.ACCOUNT_ID}`),
                    }),
                ],
            });
        }
    }
    createCode(test) {
        var _a, _b, _c;
        const codeConfig = {
            handler: test.handler,
            ...test.code.bind(this, test.handler, synthetics.RuntimeFamily.NODEJS),
        };
        return {
            handler: codeConfig.handler,
            script: codeConfig.inlineCode,
            s3Bucket: (_a = codeConfig.s3Location) === null || _a === void 0 ? void 0 : _a.bucketName,
            s3Key: (_b = codeConfig.s3Location) === null || _b === void 0 ? void 0 : _b.objectKey,
            s3ObjectVersion: (_c = codeConfig.s3Location) === null || _c === void 0 ? void 0 : _c.objectVersion,
        };
    }
    getCanaryRolePolicyDoc(artifactsBucket, prefix) {
        const { partition } = cdk.Stack.of(this);
        const policy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: ['s3:ListAllMyBuckets'],
                }),
                new iam.PolicyStatement({
                    resources: [
                        artifactsBucket.arnForObjects(`${prefix ? prefix + '/*' : '*'}`),
                    ],
                    actions: ['s3:PutObject', 's3:GetBucketLocation'],
                }),
                new iam.PolicyStatement({
                    resources: [artifactsBucket.bucketArn],
                    actions: ['s3:GetBucketLocation'],
                }),
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: ['cloudwatch:PutMetricData'],
                    conditions: {
                        StringEquals: { 'cloudwatch:namespace': 'CloudWatchSynthetics' },
                    },
                }),
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: ['xray:PutTraceSegments'],
                }),
                new iam.PolicyStatement({
                    resources: [`arn:${partition}:logs:::*`],
                    actions: [
                        'logs:CreateLogStream',
                        'logs:CreateLogGroup',
                        'logs:PutLogEvents',
                    ],
                }),
            ],
        });
        return policy;
    }
    /**
     * Measure the number of failed canary runs over a given time period.
     *
     * Default: sum over 5 minutes
     *
     * @param options - configuration options for the metric
     */
    metricFailed(options) {
        return new aws_cloudwatch_1.Metric({
            namespace: 'CloudWatchSynthetics',
            metricName: 'Failed',
            dimensionsMap: {
                CanaryName: this.canaryName,
            },
            statistic: 'Sum',
            ...options,
        }).attachTo(this);
    }
}
exports.AGSSyntheticsCanary = AGSSyntheticsCanary;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXN5bnRoZXRpY3MtY2FuYXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2Fncy1zeW50aGV0aWNzLWNhbmFyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7RUFjRTtBQUNGLHdFQUl1QztBQUN2QywrREFBbUU7QUFDbkUsaURBQWlEO0FBQ2pELDBEQUEwRDtBQUMxRCwyQ0FBMkM7QUFFM0MsMkNBQTJDO0FBQzNDLDREQUE0RDtBQUM1RCxtQ0FBbUM7QUFDbkMsNERBQTREO0FBQzVELDJDQUF1QztBQWtJdkMsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0FBRXRDLE1BQWEsbUJBQW9CLFNBQVEsc0JBQVM7SUFJOUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUErQjs7UUFDckUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRTtZQUM5QixNQUFNLHdEQUF3RCxDQUFDO1NBQ2xFO1FBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3ZDLE1BQU0saURBQWlELENBQUM7U0FDM0Q7UUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDbkMsTUFBTSxZQUFZLFNBQUcsS0FBSyxDQUFDLGFBQWEsbUNBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7UUFFdEUsaUNBQWlDO1FBQ2pDLE1BQU0sZUFBZSxHQUFHLENBQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLGVBQWUsRUFDMUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlO1lBQ3ZCLENBQUMsQ0FBQyxJQUFJLHNDQUFlLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO2dCQUM5QyxpQkFBaUIsRUFBRSxZQUFZLEtBQUssR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO2dCQUM3RCxhQUFhLEVBQUUsWUFBWTtnQkFDM0IsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLHdCQUF3QjthQUNuRCxDQUFDLENBQUMsTUFBTSxDQUFDO1FBRWhCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDO1FBRTFDLCtCQUErQjtRQUMvQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDeEQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztZQUM3QyxlQUFlLEVBQUU7Z0JBQ2IsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FDdEMsMENBQTBDLENBQzdDO2dCQUNELGlEQUFpRDtnQkFDakQsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FDdEMsOENBQThDLENBQ2pEO2FBQ0o7WUFDRCxjQUFjLEVBQUU7Z0JBQ1osWUFBWSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDO2FBQ3JFO1lBQ0QsV0FBVyxFQUFFLGlEQUFpRDtTQUNqRSxDQUFDLENBQUM7UUFFSCwyREFBMkQ7UUFDM0QsTUFBTSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsaUJBQWlCO1lBQ2hELENBQUMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsY0FBYyxLQUFLLFNBQVM7Z0JBQ3BFLENBQUMsQ0FBQztvQkFDSSxLQUFLLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxLQUFLO29CQUN4QyxTQUFTLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQ2hELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FDekMsa0NBQVcsQ0FBQyxPQUFPLENBQ3RCLENBQ0osQ0FBQyxTQUFTO29CQUNYLGdCQUFnQixFQUNaLE9BQUEsS0FBSyxDQUFDLGlCQUFpQjt5QkFDbEIsdUJBQXVCLENBQUMsa0NBQVcsQ0FBQyxPQUFPLENBQUMsMENBQzNDLEdBQUcsQ0FBQyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLGVBQWU7d0JBQzFELEVBQUU7aUJBQ1Q7Z0JBQ0gsQ0FBQyxDQUFDLFNBQVM7WUFDZixDQUFDLENBQUMsU0FBUyxDQUFDO1FBRWhCLE1BQU0sU0FBUyxTQUFHLEtBQUssQ0FBQyxTQUFTLG1DQUFJLG9CQUFvQixDQUFDO1FBRTFELE1BQU0scUJBQXFCLGVBQ3ZCLEtBQUssQ0FBQyxRQUFRLDBDQUFFLGdCQUFnQixtQ0FBSSxpQkFBaUIsQ0FBQztRQUUxRCwyQkFBMkI7UUFDM0IsSUFBSSxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDeEMsa0JBQWtCLEVBQUUsZUFBZSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7WUFDMUQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPO1lBQ3pDLGNBQWMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUk7WUFDbEMsSUFBSSxFQUFFLEtBQUssQ0FBQyxVQUFVO1lBQ3RCLFFBQVEsRUFBRTtnQkFDTixVQUFVLEVBQUUscUJBQXFCO2FBQ3BDO1lBQ0Qsd0JBQXdCLFFBQUUsS0FBSyxDQUFDLGtCQUFrQixtQ0FBSSxJQUFJO1lBQzFELElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDakMsU0FBUyxFQUFFO2dCQUNQLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixnQkFBZ0IsUUFBRSxLQUFLLENBQUMsZ0JBQWdCLG1DQUFJLEVBQUU7Z0JBQzlDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxvQkFBb0I7YUFDbkQ7WUFDRCxTQUFTO1lBQ1Qsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLHlCQUF5QjtZQUN2RCxzQkFBc0IsRUFBRSxLQUFLLENBQUMseUJBQXlCO1NBQzFELENBQUMsQ0FBQztRQUVILGlFQUFpRTtRQUNqRSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRTtZQUN4QixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FDckMsSUFBSSxFQUNKLHFCQUFxQixFQUNyQixLQUFLLENBQUMsZ0JBQWdCLENBQ3pCLENBQUM7WUFFRixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO2dCQUN6QyxXQUFXLEVBQUUsK0NBQStDO2dCQUM1RCxZQUFZLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLENBQUMsZ0JBQWdCLENBQUM7b0JBQzFCLFVBQVUsRUFBRSxDQUFDLG1DQUFtQyxDQUFDO29CQUNqRCxNQUFNLEVBQUU7d0JBQ0osYUFBYSxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQzt3QkFDakMsaUJBQWlCLEVBQUUsQ0FBQyxRQUFRLENBQUM7cUJBQ2hDO2lCQUNKO2dCQUNELE9BQU8sRUFBRTtvQkFDTCxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO3dCQUM3QixPQUFPLEVBQUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQ3BDLGVBQWUsS0FBSyxDQUFDLFVBQVUseUJBQXlCLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQy9FO3FCQUNKLENBQUM7aUJBQ0w7YUFDSixDQUFDLENBQUM7U0FDTjtJQUNMLENBQUM7SUFFTyxVQUFVLENBQUMsSUFBcUI7O1FBQ3BDLE1BQU0sVUFBVSxHQUFHO1lBQ2YsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1lBQ3JCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7U0FDekUsQ0FBQztRQUNGLE9BQU87WUFDSCxPQUFPLEVBQUUsVUFBVSxDQUFDLE9BQU87WUFDM0IsTUFBTSxFQUFFLFVBQVUsQ0FBQyxVQUFVO1lBQzdCLFFBQVEsUUFBRSxVQUFVLENBQUMsVUFBVSwwQ0FBRSxVQUFVO1lBQzNDLEtBQUssUUFBRSxVQUFVLENBQUMsVUFBVSwwQ0FBRSxTQUFTO1lBQ3ZDLGVBQWUsUUFBRSxVQUFVLENBQUMsVUFBVSwwQ0FBRSxhQUFhO1NBQ3hELENBQUM7SUFDTixDQUFDO0lBRU8sc0JBQXNCLENBQzFCLGVBQTJCLEVBQzNCLE1BQWM7UUFFZCxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekMsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDO1lBQ2xDLFVBQVUsRUFBRTtnQkFDUixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7b0JBQ3BCLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztvQkFDaEIsT0FBTyxFQUFFLENBQUMscUJBQXFCLENBQUM7aUJBQ25DLENBQUM7Z0JBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO29CQUNwQixTQUFTLEVBQUU7d0JBQ1AsZUFBZSxDQUFDLGFBQWEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7cUJBQ25FO29CQUNELE9BQU8sRUFBRSxDQUFDLGNBQWMsRUFBRSxzQkFBc0IsQ0FBQztpQkFDcEQsQ0FBQztnQkFDRixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7b0JBQ3BCLFNBQVMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUM7b0JBQ3RDLE9BQU8sRUFBRSxDQUFDLHNCQUFzQixDQUFDO2lCQUNwQyxDQUFDO2dCQUNGLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztvQkFDcEIsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO29CQUNoQixPQUFPLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQztvQkFDckMsVUFBVSxFQUFFO3dCQUNSLFlBQVksRUFBRSxFQUFFLHNCQUFzQixFQUFFLHNCQUFzQixFQUFFO3FCQUNuRTtpQkFDSixDQUFDO2dCQUNGLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztvQkFDcEIsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO29CQUNoQixPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztpQkFDckMsQ0FBQztnQkFDRixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7b0JBQ3BCLFNBQVMsRUFBRSxDQUFDLE9BQU8sU0FBUyxXQUFXLENBQUM7b0JBQ3hDLE9BQU8sRUFBRTt3QkFDTCxzQkFBc0I7d0JBQ3RCLHFCQUFxQjt3QkFDckIsbUJBQW1CO3FCQUN0QjtpQkFDSixDQUFDO2FBQ0w7U0FDSixDQUFDLENBQUM7UUFDSCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBQ0Q7Ozs7OztPQU1HO0lBQ0ksWUFBWSxDQUFDLE9BQXVCO1FBQ3ZDLE9BQU8sSUFBSSx1QkFBTSxDQUFDO1lBQ2QsU0FBUyxFQUFFLHNCQUFzQjtZQUNqQyxVQUFVLEVBQUUsUUFBUTtZQUNwQixhQUFhLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO2FBQzlCO1lBQ0QsU0FBUyxFQUFFLEtBQUs7WUFDaEIsR0FBRyxPQUFPO1NBQ2IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0NBQ0o7QUFyTUQsa0RBcU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyogXG4gIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICBcbiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKS5cbiAgWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgXG4gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgXG4gIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQge1xuICAgIEFnc1NlY3VyZUJ1Y2tldCxcbiAgICBBR1NTaGFyZWRJbmZyYUNsaWVudCxcbiAgICBTdWJuZXRHcm91cCxcbn0gZnJvbSAnQGFncy1jZGsvYWdzLXNlcnZpY2UtdGVtcGxhdGUnO1xuaW1wb3J0IHsgTWV0cmljLCBNZXRyaWNPcHRpb25zIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCAqIGFzIHN5bnRoZXRpY3MgZnJvbSAnQGF3cy1jZGsvYXdzLXN5bnRoZXRpY3MtYWxwaGEnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGNmblN5bnRoZXRpY3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLXN5bnRoZXRpY3MnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUdTU3ludGhldGljc0NhbmFyeVByb3BzIHtcbiAgICAvKipcbiAgICAgKiBOYW1lIG9mIHRoZSBjYW5hcnksIG11c3QgbWF0Y2ggXlswLTlhLXpfXFwtXSskXG4gICAgICpcbiAgICAgKiBAcmVxdWlyZWRcbiAgICAgKi9cbiAgICByZWFkb25seSBjYW5hcnlOYW1lOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IHRoZSBydW50aW1lIHZlcnNpb24gdG8gdXNlIGZvciB0aGUgY2FuYXJ5LlxuICAgICAqXG4gICAgICogQHJlcXVpcmVkXG4gICAgICovXG4gICAgcmVhZG9ubHkgcnVudGltZTogc3ludGhldGljcy5SdW50aW1lO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHR5cGUgb2YgdGVzdCB0aGF0IHlvdSB3YW50IHlvdXIgY2FuYXJ5IHRvIHJ1bi5cbiAgICAgKlxuICAgICAqIFVzZSBgVGVzdC5jdXN0b20oKWAgdG8gc3BlY2lmeSB0aGUgdGVzdCB0byBydW4uXG4gICAgICpcbiAgICAgKiBAcmVxdWlyZWRcbiAgICAgKi9cbiAgICByZWFkb25seSB0ZXN0OiBzeW50aGV0aWNzLlRlc3Q7XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IHRoZSBzY2hlZHVsZSBmb3IgaG93IG9mdGVuIHRoZSBjYW5hcnkgcnVucy5cbiAgICAgKlxuICAgICAqIEBvcHRpb25hbFxuICAgICAqIEBkZWZhdWx0IE9uY2UgZXZlcnkgNSBtaW51dGVzIChyYXRlKDUgbWludXRlcykpXG4gICAgICovXG4gICAgcmVhZG9ubHkgc2NoZWR1bGU/OiBzeW50aGV0aWNzLlNjaGVkdWxlO1xuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBvciBub3QgdGhlIGNhbmFyeSBzaG91bGQgc3RhcnQgYWZ0ZXIgY3JlYXRpb24uXG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgICovXG4gICAgcmVhZG9ubHkgc3RhcnRBZnRlckNyZWF0aW9uPzogYm9vbGVhbjtcblxuICAgIC8qKlxuICAgICAqIEVudmlyb25tZW50IHZhcmlhYmxlcyB0byBiZSBwYXNzZWQgaW50byBjYW5hcnkgdGVzdCBzY3JpcHRcbiAgICAgKlxuICAgICAqIEBvcHRpb25hbFxuICAgICAqL1xuICAgIHJlYWRvbmx5IGVudmlyb25tZW50VmFyaWFibGVzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIENhbmFyeSB0ZXN0IHRpbWVvdXQgaW4gc2Vjb25kc1xuICAgICAqXG4gICAgICogQG9wdGlvbmFsXG4gICAgICogQGRlZmF1bHQgMTUgc2Vjb25kc1xuICAgICAqL1xuICAgIHJlYWRvbmx5IHRpbWVvdXRJblNlY29uZHM/OiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBBR1MgU2hhcmVkIEluZnJhIENsaWVudCBpbnN0YW5jZVxuICAgICAqXG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgcmVhZG9ubHkgc2hhcmVkSW5mcmFDbGllbnQ/OiBBR1NTaGFyZWRJbmZyYUNsaWVudDtcblxuICAgIC8qKlxuICAgICAqIFZQQyBjb25maWd1cmF0aW9uIGlmIGNhbmFyeSB3aWxsIHJ1biBpbnNpZGUgdGhlIFZQQ1xuICAgICAqXG4gICAgICogSWYgYm90aCBzaGFyZWRJbmZyYUNsaWVudCBhbmQgdnBjQ29uZmlnIHNwZWNpZmllZCwgdnBjQ29uZmlnIHdpbGwgb3ZlcnJpZGUgdGhlIHZwYyBzZXR0aW5nIGluIHNoYXJlZCBpbmZyYSBjbGllbnQuXG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKiBAZGVmYXVsdCBDYW5hcnkgd2lsbCBydW4gd2l0aG91dCBWUENcbiAgICAgKi9cbiAgICByZWFkb25seSB2cGNDb25maWc/OiBjZm5TeW50aGV0aWNzLkNmbkNhbmFyeS5WUENDb25maWdQcm9wZXJ0eTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBTMyBidWNrZXQgcHJlZml4XG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWwgLSBTcGVjaWZ5IHRoaXMgaWYgeW91IHdhbnQgYSBtb3JlIHNwZWNpZmljIHBhdGggd2l0aGluIHRoZSBhcnRpZmFjdHMgYnVja2V0LlxuICAgICAqIEBkZWZhdWx0IE5vIHByZWZpeFxuICAgICAqL1xuICAgIHJlYWRvbmx5IHMzQnVja2V0UHJlZml4Pzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogU3BlY2lmeSB0aGUgQVJOIG9mIHRoZSBTTlMgVG9waWMgdGhhdCB0aGUgZmFpbGVkIGNhbmFyeSB0ZXN0IGFsZXJ0IHRvIGJlIHNlbnQgdG9cbiAgICAgKlxuICAgICAqIEBvcHRpb25hbFxuICAgICAqIEBkZWZhdWx0IE5vbmUgLSBubyBhbGVydCB0byBiZSBzZW50IHRvIFNOUyB0b3BpY1xuICAgICAqL1xuICAgIHJlYWRvbmx5IGFsZXJ0U05TVG9waWNBcm4/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IGlmIHRoZSBhcnRpZmFjdCBidWNrZXQgc2hvdWxkIGJlIHJlbW92ZWQgd2hlbiBjYW5hcnkgaXMgZGVzdHJveWVkXG4gICAgICpcbiAgICAgKiBBdmFpbGFibGUgb3B0aW9uIGlzIGluIGNkay5SZW1vdmFsUG9saWN5XG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKiBAZGVmYXVsdCBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAgICovXG4gICAgcmVhZG9ubHkgcmVtb3ZhbFBvbGljeT86IGNkay5SZW1vdmFsUG9saWN5O1xuXG4gICAgLyoqXG4gICAgICogVGhlIGNhbmFyeSdzIGJ1Y2tldCBlbmNyeXB0aW9uIGtleSBhcm5cbiAgICAgKlxuICAgICAqIEBvcHRpb25hbCAtIElmIGEga2V5IGFybiBpcyBzcGVjaWZpZWQsIHRoZSBjb3JyZXNwb25kaW5nIEtNUyBrZXkgd2lsbCBiZSB1c2VkIHRvIGVuY3J5cHQgY2FuYXJ5IFMzIGJ1Y2tldC5cbiAgICAgKiBAZGVmYXVsdCBOb25lIC0gQSBuZXcga2V5IGlzIHByb3Zpc2lvbmVkIGZvciB0aGUgY2FuYXJ5IFMzIGJ1Y2tldC5cbiAgICAgKi9cbiAgICByZWFkb25seSBzM0J1Y2tldEVuY3J5cHRpb25LZXlBcm4/OiBzdHJpbmc7XG5cbiAgICAvKiogVGhlIGNhbmFyeSBsb2cgYnVja2V0XG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWwgLSBBbGwgY2FuYXJ5IGxvZ3Mgd2lsbCBiZSBzdG9yZWQgaW4gdGhlIHByb3ZpZGVkIGJ1Y2tldC5cbiAgICAgKiBAZGVmYXVsdCBOb25lIC0gQSBuZXcgYnVja2V0IGlzIHByb3Zpc2lvbmVkIGZvciB0aGUgY2FuYXJ5LlxuICAgICAqL1xuICAgIHJlYWRvbmx5IGNhbmFyeUxvZ0J1Y2tldD86IHMzLklCdWNrZXQ7XG5cbiAgICAvKiogVGhlIG51bWJlciBvZiBkYXlzIHRvIHJldGFpbiBkYXRhIGFib3V0IGZhaWxlZCBydW5zIG9mIHRoaXMgY2FuYXJ5XG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKiBAZGVmYXVsdCBOb25lIC0gSWYgbm9uZSBvZiBwcm92aWRlZCwgY2RrIGF1dG9tYXRpY2FsbHkgYXBwbGllcyB0aGUgZGVmYXVsdCB2YWx1ZSBvZiAzMSBkYXlzLlxuICAgICAqL1xuICAgIHJlYWRvbmx5IGZhaWx1cmVMb2dSZXRlbnRpb25QZXJpb2Q/OiBudW1iZXI7XG5cbiAgICAvKiogVGhlIG51bWJlciBvZiBkYXlzIHRvIHJldGFpbiBkYXRhIGFib3V0IHN1Y2Nlc3NmdWwgcnVucyBvZiB0aGlzIGNhbmFyeVxuICAgICAqXG4gICAgICogQG9wdGlvbmFsXG4gICAgICogQGRlZmF1bHQgTm9uZSAtIElmIG5vbmUgb2YgcHJvdmlkZWQsIGNkayBhdXRvbWF0aWNhbGx5IGFwcGxpZXMgdGhlIGRlZmF1bHQgdmFsdWUgb2YgMzEgZGF5cy5cbiAgICAgKi9cbiAgICByZWFkb25seSBzdWNjZXNzTG9nUmV0ZW50aW9uUGVyaW9kPzogbnVtYmVyO1xufVxuXG5jb25zdCBjYW5hcnlOYW1lUmVnID0gL15bMC05YS16Xy1dKyQvO1xuXG5leHBvcnQgY2xhc3MgQUdTU3ludGhldGljc0NhbmFyeSBleHRlbmRzIENvbnN0cnVjdCB7XG4gICAgcHVibGljIHJlYWRvbmx5IGNhbmFyeVJvbGU6IGlhbS5Sb2xlO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY2FuYXJ5TmFtZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFHU1N5bnRoZXRpY3NDYW5hcnlQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgICAgIGlmIChwcm9wcy5jYW5hcnlOYW1lLmxlbmd0aCA+IDIxKSB7XG4gICAgICAgICAgICB0aHJvdyAnQ2FuYXJ5IG5hbWUgbXVzdCBiZSBsZXNzIHRoYW4gMjEgY2hhcmFjdGVycyBpbiBsZW5ndGguJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2FuYXJ5TmFtZVJlZy50ZXN0KHByb3BzLmNhbmFyeU5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBgSW52YWxpZCBjYW5hcnkgbmFtZSwgbXVzdCBtYXRjaCAvXlswLTlhLXpfLV0rJC9gO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYW5hcnlOYW1lID0gcHJvcHMuY2FuYXJ5TmFtZTtcbiAgICAgICAgY29uc3QgcmVtb3ZlUG9saWN5ID0gcHJvcHMucmVtb3ZhbFBvbGljeSA/PyBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBjYW5hcnkgYXJ0aWZhY3RzIGJ1Y2tldFxuICAgICAgICBjb25zdCBhcnRpZmFjdHNCdWNrZXQgPSBwcm9wcz8uY2FuYXJ5TG9nQnVja2V0XG4gICAgICAgICAgICA/IHByb3BzLmNhbmFyeUxvZ0J1Y2tldFxuICAgICAgICAgICAgOiBuZXcgQWdzU2VjdXJlQnVja2V0KHRoaXMsICdDYW5hcnlBcnRpZmFjdEJ1Y2tldCcsIHtcbiAgICAgICAgICAgICAgICAgIGF1dG9EZWxldGVPYmplY3RzOiByZW1vdmVQb2xpY3kgPT09IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICAgICAgICAgICAgICByZW1vdmFsUG9saWN5OiByZW1vdmVQb2xpY3ksXG4gICAgICAgICAgICAgICAgICBlbmNyeXB0aW9uS2V5QXJuOiBwcm9wcy5zM0J1Y2tldEVuY3J5cHRpb25LZXlBcm4sXG4gICAgICAgICAgICAgIH0pLmJ1Y2tldDtcblxuICAgICAgICBjb25zdCBwcmVmaXggPSBwcm9wcy5zM0J1Y2tldFByZWZpeCB8fCAnJztcblxuICAgICAgICAvLyBjcmVhdGUgY2FuYXJ5IGV4ZWN1dGlvbiByb2xlXG4gICAgICAgIHRoaXMuY2FuYXJ5Um9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCBgQ2FuYXJ5RXhlY3V0aW9uUm9sZWAsIHtcbiAgICAgICAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEnKSxcbiAgICAgICAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICAgICAgICAgICAgJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAvLyBtdXN0IHRvIGhhdmUgdGhpcyBvbmUgZm9yIGxhbWJkYSB0byBydW4gaW4gVlBDXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFxuICAgICAgICAgICAgICAgICAgICAnc2VydmljZS1yb2xlL0FXU0xhbWJkYVZQQ0FjY2Vzc0V4ZWN1dGlvblJvbGUnXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICAgICAgICAgIENhbmFyeVBvbGljeTogdGhpcy5nZXRDYW5hcnlSb2xlUG9saWN5RG9jKGFydGlmYWN0c0J1Y2tldCwgcHJlZml4KSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0V4ZWN1dGlvbiBSb2xlIGZvciBDbG91ZFdhdGNoIFN5bnRoZXRpY3MgQ2FuYXJ5JyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcHV0IGNhbmFyeSBpbiBWUEMgaWYgYXBpZ2F0ZXdheSBpcyBjb25maWd1cmVkIGFzIHByaXZhdGVcbiAgICAgICAgY29uc3Qgc2hhcmVkSW5mcmFWcGNDb25maWcgPSBwcm9wcy5zaGFyZWRJbmZyYUNsaWVudFxuICAgICAgICAgICAgPyBwcm9wcy5zaGFyZWRJbmZyYUNsaWVudC5kZXBsb3ltZW50T3B0aW9ucy5hcGlHYXRld2F5VHlwZSA9PT0gJ3ByaXZhdGUnXG4gICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgdnBjSWQ6IHByb3BzLnNoYXJlZEluZnJhQ2xpZW50LnZwYy52cGNJZCxcbiAgICAgICAgICAgICAgICAgICAgICBzdWJuZXRJZHM6IHByb3BzLnNoYXJlZEluZnJhQ2xpZW50LnZwYy5zZWxlY3RTdWJuZXRzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5zaGFyZWRJbmZyYUNsaWVudC5nZXRTdWJuZXRzQnlHcm91cE5hbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdWJuZXRHcm91cC5TRVJWSUNFXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICApLnN1Ym5ldElkcyxcbiAgICAgICAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwSWRzOlxuICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5zaGFyZWRJbmZyYUNsaWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldFN1Ym5ldFNlY3VyaXR5R3JvdXBzKFN1Ym5ldEdyb3VwLlNFUlZJQ0UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/Lm1hcCgoc2VjdXJpdHlHcm91cCkgPT4gc2VjdXJpdHlHcm91cC5zZWN1cml0eUdyb3VwSWQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICBjb25zdCB2cGNDb25maWcgPSBwcm9wcy52cGNDb25maWcgPz8gc2hhcmVkSW5mcmFWcGNDb25maWc7XG5cbiAgICAgICAgY29uc3Qgc2NoZWR1bGVFeHByZXNzU3RyaW5nID1cbiAgICAgICAgICAgIHByb3BzLnNjaGVkdWxlPy5leHByZXNzaW9uU3RyaW5nID8/ICdyYXRlKDUgbWludXRlcyknO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBzeW50aGV0aWNzIGNhbmFyeVxuICAgICAgICBuZXcgY2ZuU3ludGhldGljcy5DZm5DYW5hcnkodGhpcywgJ0NhbmFyeScsIHtcbiAgICAgICAgICAgIGFydGlmYWN0UzNMb2NhdGlvbjogYXJ0aWZhY3RzQnVja2V0LnMzVXJsRm9yT2JqZWN0KHByZWZpeCksXG4gICAgICAgICAgICBleGVjdXRpb25Sb2xlQXJuOiB0aGlzLmNhbmFyeVJvbGUucm9sZUFybixcbiAgICAgICAgICAgIHJ1bnRpbWVWZXJzaW9uOiBwcm9wcy5ydW50aW1lLm5hbWUsXG4gICAgICAgICAgICBuYW1lOiBwcm9wcy5jYW5hcnlOYW1lLFxuICAgICAgICAgICAgc2NoZWR1bGU6IHtcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBzY2hlZHVsZUV4cHJlc3NTdHJpbmcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRDYW5hcnlBZnRlckNyZWF0aW9uOiBwcm9wcy5zdGFydEFmdGVyQ3JlYXRpb24gPz8gdHJ1ZSxcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY3JlYXRlQ29kZShwcm9wcy50ZXN0KSxcbiAgICAgICAgICAgIHJ1bkNvbmZpZzoge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVRyYWNpbmc6IHRydWUsXG4gICAgICAgICAgICAgICAgdGltZW91dEluU2Vjb25kczogcHJvcHMudGltZW91dEluU2Vjb25kcyA/PyAxNSxcbiAgICAgICAgICAgICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczogcHJvcHMuZW52aXJvbm1lbnRWYXJpYWJsZXMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdnBjQ29uZmlnLFxuICAgICAgICAgICAgZmFpbHVyZVJldGVudGlvblBlcmlvZDogcHJvcHMuZmFpbHVyZUxvZ1JldGVudGlvblBlcmlvZCxcbiAgICAgICAgICAgIHN1Y2Nlc3NSZXRlbnRpb25QZXJpb2Q6IHByb3BzLnN1Y2Nlc3NMb2dSZXRlbnRpb25QZXJpb2QsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBjbG91ZHdhdGNoIGV2ZW50IHJ1bGUgdG8gc2VuZCBmYWlsZWQgYWxlcnQgdG8gU05TIHRvcGljXG4gICAgICAgIGlmIChwcm9wcy5hbGVydFNOU1RvcGljQXJuKSB7XG4gICAgICAgICAgICBjb25zdCBhbGVydFRvcGljID0gc25zLlRvcGljLmZyb21Ub3BpY0FybihcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgICdDYW5hcnlBbGVydFNOU1RvcGljJyxcbiAgICAgICAgICAgICAgICBwcm9wcy5hbGVydFNOU1RvcGljQXJuXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ0NhbmFyeVRlc3RFdmVudFJ1bGUnLCB7XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFdmVudCBydWxlIGZvciBtb25pdG9yaW5nIENhbmFyeSBUZXN0IFJlc3VsdHMnLFxuICAgICAgICAgICAgICAgIGV2ZW50UGF0dGVybjoge1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IFsnYXdzLnN5bnRoZXRpY3MnXSxcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsVHlwZTogWydTeW50aGV0aWNzIENhbmFyeSBUZXN0UnVuIEZhaWx1cmUnXSxcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnY2FuYXJ5LW5hbWUnOiBbcHJvcHMuY2FuYXJ5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAndGVzdC1ydW4tc3RhdHVzJzogWydGQUlMRUQnXSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRhcmdldHM6IFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IHRhcmdldHMuU25zVG9waWMoYWxlcnRUb3BpYywge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXZlbnRzLlJ1bGVUYXJnZXRJbnB1dC5mcm9tVGV4dChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgQ2FuYXJ5IHRlc3QgJHtwcm9wcy5jYW5hcnlOYW1lfSBmYWlsZWQgb24gaW4gYWNjb3VudCAke2Nkay5Bd3MuQUNDT1VOVF9JRH1gXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZUNvZGUodGVzdDogc3ludGhldGljcy5UZXN0KTogY2ZuU3ludGhldGljcy5DZm5DYW5hcnkuQ29kZVByb3BlcnR5IHtcbiAgICAgICAgY29uc3QgY29kZUNvbmZpZyA9IHtcbiAgICAgICAgICAgIGhhbmRsZXI6IHRlc3QuaGFuZGxlcixcbiAgICAgICAgICAgIC4uLnRlc3QuY29kZS5iaW5kKHRoaXMsIHRlc3QuaGFuZGxlciwgc3ludGhldGljcy5SdW50aW1lRmFtaWx5Lk5PREVKUyksXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBoYW5kbGVyOiBjb2RlQ29uZmlnLmhhbmRsZXIsXG4gICAgICAgICAgICBzY3JpcHQ6IGNvZGVDb25maWcuaW5saW5lQ29kZSxcbiAgICAgICAgICAgIHMzQnVja2V0OiBjb2RlQ29uZmlnLnMzTG9jYXRpb24/LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBzM0tleTogY29kZUNvbmZpZy5zM0xvY2F0aW9uPy5vYmplY3RLZXksXG4gICAgICAgICAgICBzM09iamVjdFZlcnNpb246IGNvZGVDb25maWcuczNMb2NhdGlvbj8ub2JqZWN0VmVyc2lvbixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENhbmFyeVJvbGVQb2xpY3lEb2MoXG4gICAgICAgIGFydGlmYWN0c0J1Y2tldDogczMuSUJ1Y2tldCxcbiAgICAgICAgcHJlZml4OiBzdHJpbmdcbiAgICApOiBpYW0uUG9saWN5RG9jdW1lbnQge1xuICAgICAgICBjb25zdCB7IHBhcnRpdGlvbiB9ID0gY2RrLlN0YWNrLm9mKHRoaXMpO1xuICAgICAgICBjb25zdCBwb2xpY3kgPSBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnczM6TGlzdEFsbE15QnVja2V0cyddLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnRpZmFjdHNCdWNrZXQuYXJuRm9yT2JqZWN0cyhgJHtwcmVmaXggPyBwcmVmaXggKyAnLyonIDogJyonfWApLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3MzOlB1dE9iamVjdCcsICdzMzpHZXRCdWNrZXRMb2NhdGlvbiddLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYXJ0aWZhY3RzQnVja2V0LmJ1Y2tldEFybl0sXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnczM6R2V0QnVja2V0TG9jYXRpb24nXSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnY2xvdWR3YXRjaDpQdXRNZXRyaWNEYXRhJ10sXG4gICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczogeyAnY2xvdWR3YXRjaDpuYW1lc3BhY2UnOiAnQ2xvdWRXYXRjaFN5bnRoZXRpY3MnIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3hyYXk6UHV0VHJhY2VTZWdtZW50cyddLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYGFybjoke3BhcnRpdGlvbn06bG9nczo6OipgXSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHBvbGljeTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWVhc3VyZSB0aGUgbnVtYmVyIG9mIGZhaWxlZCBjYW5hcnkgcnVucyBvdmVyIGEgZ2l2ZW4gdGltZSBwZXJpb2QuXG4gICAgICpcbiAgICAgKiBEZWZhdWx0OiBzdW0gb3ZlciA1IG1pbnV0ZXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgbWV0cmljXG4gICAgICovXG4gICAgcHVibGljIG1ldHJpY0ZhaWxlZChvcHRpb25zPzogTWV0cmljT3B0aW9ucyk6IE1ldHJpYyB7XG4gICAgICAgIHJldHVybiBuZXcgTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0Nsb3VkV2F0Y2hTeW50aGV0aWNzJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdGYWlsZWQnLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICAgIENhbmFyeU5hbWU6IHRoaXMuY2FuYXJ5TmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgfSkuYXR0YWNoVG8odGhpcyk7XG4gICAgfVxufVxuIl19