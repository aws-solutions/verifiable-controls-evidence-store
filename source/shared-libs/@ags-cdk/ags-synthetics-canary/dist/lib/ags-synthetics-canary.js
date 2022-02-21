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
const aws_cloudwatch_1 = require("@aws-cdk/aws-cloudwatch");
const events = require("@aws-cdk/aws-events");
const targets = require("@aws-cdk/aws-events-targets");
const iam = require("@aws-cdk/aws-iam");
const sns = require("@aws-cdk/aws-sns");
const synthetics = require("@aws-cdk/aws-synthetics");
const cdk = require("@aws-cdk/core");
const canaryNameReg = /^[0-9a-z_-]+$/;
class AGSSyntheticsCanary extends cdk.Construct {
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
        const artifactsBucket = new ags_service_template_1.AgsSecureBucket(this, 'CanaryArtifactBucket', {
            autoDeleteObjects: removePolicy === cdk.RemovalPolicy.DESTROY,
            removalPolicy: removePolicy,
            encryptionKeyArn: props.s3BucketEncryptionKeyArn,
        });
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
                CanaryPolicy: this.getCanaryRolePolicyDoc(artifactsBucket.bucket, prefix),
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
        new synthetics.CfnCanary(this, 'Canary', {
            artifactS3Location: artifactsBucket.bucket.s3UrlForObject(prefix),
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
            ...test.code.bind(this, test.handler),
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
            dimensions: {
                CanaryName: this.canaryName,
            },
            statistic: 'Sum',
            ...options,
        }).attachTo(this);
    }
}
exports.AGSSyntheticsCanary = AGSSyntheticsCanary;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXN5bnRoZXRpY3MtY2FuYXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2Fncy1zeW50aGV0aWNzLWNhbmFyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7RUFjRTtBQUNGLHdFQUl1QztBQUN2Qyw0REFBZ0U7QUFDaEUsOENBQThDO0FBQzlDLHVEQUF1RDtBQUN2RCx3Q0FBd0M7QUFFeEMsd0NBQXdDO0FBQ3hDLHNEQUFzRDtBQUN0RCxxQ0FBcUM7QUE2R3JDLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQztBQUV0QyxNQUFhLG1CQUFvQixTQUFRLEdBQUcsQ0FBQyxTQUFTO0lBSWxELFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBK0I7O1FBQ3pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxFQUFFLEVBQUU7WUFDOUIsTUFBTSx3REFBd0QsQ0FBQztTQUNsRTtRQUVELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUN2QyxNQUFNLGlEQUFpRCxDQUFDO1NBQzNEO1FBRUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ25DLE1BQU0sWUFBWSxTQUFHLEtBQUssQ0FBQyxhQUFhLG1DQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1FBRXRFLGlDQUFpQztRQUNqQyxNQUFNLGVBQWUsR0FBRyxJQUFJLHNDQUFlLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQ3RFLGlCQUFpQixFQUFFLFlBQVksS0FBSyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDN0QsYUFBYSxFQUFFLFlBQVk7WUFDM0IsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLHdCQUF3QjtTQUNuRCxDQUFDLENBQUM7UUFF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eEMsT0FBTyxFQUFFO3dCQUNMLHNCQUFzQjt3QkFDdEIscUJBQXFCO3dCQUNyQixtQkFBbUI7cUJBQ3RCO2lCQUNKLENBQUM7YUFDTDtTQUNKLENBQUMsQ0FBQztRQUNILE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFDRDs7Ozs7O09BTUc7SUFDSSxZQUFZLENBQUMsT0FBdUI7UUFDdkMsT0FBTyxJQUFJLHVCQUFNLENBQUM7WUFDZCxTQUFTLEVBQUUsc0JBQXNCO1lBQ2pDLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLFVBQVUsRUFBRTtnQkFDUixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7YUFDOUI7WUFDRCxTQUFTLEVBQUUsS0FBSztZQUNoQixHQUFHLE9BQU87U0FDYixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLENBQUM7Q0FDSjtBQWpNRCxrREFpTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCB7XG4gICAgQWdzU2VjdXJlQnVja2V0LFxuICAgIEFHU1NoYXJlZEluZnJhQ2xpZW50LFxuICAgIFN1Ym5ldEdyb3VwLFxufSBmcm9tICdAYWdzLWNkay9hZ3Mtc2VydmljZS10ZW1wbGF0ZSc7XG5pbXBvcnQgeyBNZXRyaWMsIE1ldHJpY09wdGlvbnMgfSBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnQGF3cy1jZGsvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ0Bhd3MtY2RrL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdAYXdzLWNkay9hd3MtczMnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ0Bhd3MtY2RrL2F3cy1zbnMnO1xuaW1wb3J0ICogYXMgc3ludGhldGljcyBmcm9tICdAYXdzLWNkay9hd3Mtc3ludGhldGljcyc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUdTU3ludGhldGljc0NhbmFyeVByb3BzIHtcbiAgICAvKipcbiAgICAgKiBOYW1lIG9mIHRoZSBjYW5hcnksIG11c3QgbWF0Y2ggXlswLTlhLXpfXFwtXSskXG4gICAgICpcbiAgICAgKiBAcmVxdWlyZWRcbiAgICAgKi9cbiAgICByZWFkb25seSBjYW5hcnlOYW1lOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IHRoZSBydW50aW1lIHZlcnNpb24gdG8gdXNlIGZvciB0aGUgY2FuYXJ5LlxuICAgICAqXG4gICAgICogQHJlcXVpcmVkXG4gICAgICovXG4gICAgcmVhZG9ubHkgcnVudGltZTogc3ludGhldGljcy5SdW50aW1lO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHR5cGUgb2YgdGVzdCB0aGF0IHlvdSB3YW50IHlvdXIgY2FuYXJ5IHRvIHJ1bi5cbiAgICAgKlxuICAgICAqIFVzZSBgVGVzdC5jdXN0b20oKWAgdG8gc3BlY2lmeSB0aGUgdGVzdCB0byBydW4uXG4gICAgICpcbiAgICAgKiBAcmVxdWlyZWRcbiAgICAgKi9cbiAgICByZWFkb25seSB0ZXN0OiBzeW50aGV0aWNzLlRlc3Q7XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IHRoZSBzY2hlZHVsZSBmb3IgaG93IG9mdGVuIHRoZSBjYW5hcnkgcnVucy5cbiAgICAgKlxuICAgICAqIEBvcHRpb25hbFxuICAgICAqIEBkZWZhdWx0IE9uY2UgZXZlcnkgNSBtaW51dGVzIChyYXRlKDUgbWludXRlcykpXG4gICAgICovXG4gICAgcmVhZG9ubHkgc2NoZWR1bGU/OiBzeW50aGV0aWNzLlNjaGVkdWxlO1xuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBvciBub3QgdGhlIGNhbmFyeSBzaG91bGQgc3RhcnQgYWZ0ZXIgY3JlYXRpb24uXG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgICovXG4gICAgcmVhZG9ubHkgc3RhcnRBZnRlckNyZWF0aW9uPzogYm9vbGVhbjtcblxuICAgIC8qKlxuICAgICAqIEVudmlyb25tZW50IHZhcmlhYmxlcyB0byBiZSBwYXNzZWQgaW50byBjYW5hcnkgdGVzdCBzY3JpcHRcbiAgICAgKlxuICAgICAqIEBvcHRpb25hbFxuICAgICAqL1xuICAgIHJlYWRvbmx5IGVudmlyb25tZW50VmFyaWFibGVzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIENhbmFyeSB0ZXN0IHRpbWVvdXQgaW4gc2Vjb25kc1xuICAgICAqXG4gICAgICogQG9wdGlvbmFsXG4gICAgICogQGRlZmF1bHQgMTUgc2Vjb25kc1xuICAgICAqL1xuICAgIHJlYWRvbmx5IHRpbWVvdXRJblNlY29uZHM/OiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBBR1MgU2hhcmVkIEluZnJhIENsaWVudCBpbnN0YW5jZVxuICAgICAqXG4gICAgICogQG9wdGlvbmFsXG4gICAgICovXG4gICAgcmVhZG9ubHkgc2hhcmVkSW5mcmFDbGllbnQ/OiBBR1NTaGFyZWRJbmZyYUNsaWVudDtcblxuICAgIC8qKlxuICAgICAqIFZQQyBjb25maWd1cmF0aW9uIGlmIGNhbmFyeSB3aWxsIHJ1biBpbnNpZGUgdGhlIFZQQ1xuICAgICAqXG4gICAgICogSWYgYm90aCBzaGFyZWRJbmZyYUNsaWVudCBhbmQgdnBjQ29uZmlnIHNwZWNpZmllZCwgdnBjQ29uZmlnIHdpbGwgb3ZlcnJpZGUgdGhlIHZwYyBzZXR0aW5nIGluIHNoYXJlZCBpbmZyYSBjbGllbnQuXG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKiBAZGVmYXVsdCBDYW5hcnkgd2lsbCBydW4gd2l0aG91dCBWUENcbiAgICAgKi9cbiAgICByZWFkb25seSB2cGNDb25maWc/OiBzeW50aGV0aWNzLkNmbkNhbmFyeS5WUENDb25maWdQcm9wZXJ0eTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBTMyBidWNrZXQgcHJlZml4XG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWwgLSBTcGVjaWZ5IHRoaXMgaWYgeW91IHdhbnQgYSBtb3JlIHNwZWNpZmljIHBhdGggd2l0aGluIHRoZSBhcnRpZmFjdHMgYnVja2V0LlxuICAgICAqIEBkZWZhdWx0IE5vIHByZWZpeFxuICAgICAqL1xuICAgIHJlYWRvbmx5IHMzQnVja2V0UHJlZml4Pzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogU3BlY2lmeSB0aGUgQVJOIG9mIHRoZSBTTlMgVG9waWMgdGhhdCB0aGUgZmFpbGVkIGNhbmFyeSB0ZXN0IGFsZXJ0IHRvIGJlIHNlbnQgdG9cbiAgICAgKlxuICAgICAqIEBvcHRpb25hbFxuICAgICAqIEBkZWZhdWx0IE5vbmUgLSBubyBhbGVydCB0byBiZSBzZW50IHRvIFNOUyB0b3BpY1xuICAgICAqL1xuICAgIHJlYWRvbmx5IGFsZXJ0U05TVG9waWNBcm4/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IGlmIHRoZSBhcnRpZmFjdCBidWNrZXQgc2hvdWxkIGJlIHJlbW92ZWQgd2hlbiBjYW5hcnkgaXMgZGVzdHJveWVkXG4gICAgICpcbiAgICAgKiBBdmFpbGFibGUgb3B0aW9uIGlzIGluIGNkay5SZW1vdmFsUG9saWN5XG4gICAgICpcbiAgICAgKiBAb3B0aW9uYWxcbiAgICAgKiBAZGVmYXVsdCBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAgICovXG4gICAgcmVhZG9ubHkgcmVtb3ZhbFBvbGljeT86IGNkay5SZW1vdmFsUG9saWN5O1xuXG4gICAgLyoqXG4gICAgICogVGhlIGNhbmFyeSdzIGJ1Y2tldCBlbmNyeXB0aW9uIGtleSBhcm5cbiAgICAgKlxuICAgICAqIEBvcHRpb25hbCAtIElmIGEga2V5IGFybiBpcyBzcGVjaWZpZWQsIHRoZSBjb3JyZXNwb25kaW5nIEtNUyBrZXkgd2lsbCBiZSB1c2VkIHRvIGVuY3J5cHQgY2FuYXJ5IFMzIGJ1Y2tldC5cbiAgICAgKiBAZGVmYXVsdCBOb25lIC0gQSBuZXcga2V5IGlzIHByb3Zpc2lvbmVkIGZvciB0aGUgY2FuYXJ5IFMzIGJ1Y2tldC5cbiAgICAgKi9cbiAgICByZWFkb25seSBzM0J1Y2tldEVuY3J5cHRpb25LZXlBcm4/OiBzdHJpbmc7XG59XG5cbmNvbnN0IGNhbmFyeU5hbWVSZWcgPSAvXlswLTlhLXpfLV0rJC87XG5cbmV4cG9ydCBjbGFzcyBBR1NTeW50aGV0aWNzQ2FuYXJ5IGV4dGVuZHMgY2RrLkNvbnN0cnVjdCB7XG4gICAgcHVibGljIHJlYWRvbmx5IGNhbmFyeVJvbGU6IGlhbS5Sb2xlO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY2FuYXJ5TmFtZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBR1NTeW50aGV0aWNzQ2FuYXJ5UHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICBpZiAocHJvcHMuY2FuYXJ5TmFtZS5sZW5ndGggPiAyMSkge1xuICAgICAgICAgICAgdGhyb3cgJ0NhbmFyeSBuYW1lIG11c3QgYmUgbGVzcyB0aGFuIDIxIGNoYXJhY3RlcnMgaW4gbGVuZ3RoLic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNhbmFyeU5hbWVSZWcudGVzdChwcm9wcy5jYW5hcnlOYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgYEludmFsaWQgY2FuYXJ5IG5hbWUsIG11c3QgbWF0Y2ggL15bMC05YS16Xy1dKyQvYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FuYXJ5TmFtZSA9IHByb3BzLmNhbmFyeU5hbWU7XG4gICAgICAgIGNvbnN0IHJlbW92ZVBvbGljeSA9IHByb3BzLnJlbW92YWxQb2xpY3kgPz8gY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWTtcblxuICAgICAgICAvLyBjcmVhdGUgY2FuYXJ5IGFydGlmYWN0cyBidWNrZXRcbiAgICAgICAgY29uc3QgYXJ0aWZhY3RzQnVja2V0ID0gbmV3IEFnc1NlY3VyZUJ1Y2tldCh0aGlzLCAnQ2FuYXJ5QXJ0aWZhY3RCdWNrZXQnLCB7XG4gICAgICAgICAgICBhdXRvRGVsZXRlT2JqZWN0czogcmVtb3ZlUG9saWN5ID09PSBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogcmVtb3ZlUG9saWN5LFxuICAgICAgICAgICAgZW5jcnlwdGlvbktleUFybjogcHJvcHMuczNCdWNrZXRFbmNyeXB0aW9uS2V5QXJuLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBwcmVmaXggPSBwcm9wcy5zM0J1Y2tldFByZWZpeCB8fCAnJztcblxuICAgICAgICAvLyBjcmVhdGUgY2FuYXJ5IGV4ZWN1dGlvbiByb2xlXG4gICAgICAgIHRoaXMuY2FuYXJ5Um9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCBgQ2FuYXJ5RXhlY3V0aW9uUm9sZWAsIHtcbiAgICAgICAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEnKSxcbiAgICAgICAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICAgICAgICAgICAgJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAvLyBtdXN0IHRvIGhhdmUgdGhpcyBvbmUgZm9yIGxhbWJkYSB0byBydW4gaW4gVlBDXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFxuICAgICAgICAgICAgICAgICAgICAnc2VydmljZS1yb2xlL0FXU0xhbWJkYVZQQ0FjY2Vzc0V4ZWN1dGlvblJvbGUnXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICAgICAgICAgIENhbmFyeVBvbGljeTogdGhpcy5nZXRDYW5hcnlSb2xlUG9saWN5RG9jKGFydGlmYWN0c0J1Y2tldC5idWNrZXQsIHByZWZpeCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeGVjdXRpb24gUm9sZSBmb3IgQ2xvdWRXYXRjaCBTeW50aGV0aWNzIENhbmFyeScsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHB1dCBjYW5hcnkgaW4gVlBDIGlmIGFwaWdhdGV3YXkgaXMgY29uZmlndXJlZCBhcyBwcml2YXRlXG4gICAgICAgIGNvbnN0IHNoYXJlZEluZnJhVnBjQ29uZmlnID0gcHJvcHMuc2hhcmVkSW5mcmFDbGllbnRcbiAgICAgICAgICAgID8gcHJvcHMuc2hhcmVkSW5mcmFDbGllbnQuZGVwbG95bWVudE9wdGlvbnMuYXBpR2F0ZXdheVR5cGUgPT09ICdwcml2YXRlJ1xuICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgIHZwY0lkOiBwcm9wcy5zaGFyZWRJbmZyYUNsaWVudC52cGMudnBjSWQsXG4gICAgICAgICAgICAgICAgICAgICAgc3VibmV0SWRzOiBwcm9wcy5zaGFyZWRJbmZyYUNsaWVudC52cGMuc2VsZWN0U3VibmV0cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMuc2hhcmVkSW5mcmFDbGllbnQuZ2V0U3VibmV0c0J5R3JvdXBOYW1lKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU3VibmV0R3JvdXAuU0VSVklDRVxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgKS5zdWJuZXRJZHMsXG4gICAgICAgICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cElkczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMuc2hhcmVkSW5mcmFDbGllbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5nZXRTdWJuZXRTZWN1cml0eUdyb3VwcyhTdWJuZXRHcm91cC5TRVJWSUNFKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPy5tYXAoKHNlY3VyaXR5R3JvdXApID0+IHNlY3VyaXR5R3JvdXAuc2VjdXJpdHlHcm91cElkKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICBbXSxcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgY29uc3QgdnBjQ29uZmlnID0gcHJvcHMudnBjQ29uZmlnID8/IHNoYXJlZEluZnJhVnBjQ29uZmlnO1xuXG4gICAgICAgIGNvbnN0IHNjaGVkdWxlRXhwcmVzc1N0cmluZyA9XG4gICAgICAgICAgICBwcm9wcy5zY2hlZHVsZT8uZXhwcmVzc2lvblN0cmluZyA/PyAncmF0ZSg1IG1pbnV0ZXMpJztcblxuICAgICAgICAvLyBjcmVhdGUgc3ludGhldGljcyBjYW5hcnlcbiAgICAgICAgbmV3IHN5bnRoZXRpY3MuQ2ZuQ2FuYXJ5KHRoaXMsICdDYW5hcnknLCB7XG4gICAgICAgICAgICBhcnRpZmFjdFMzTG9jYXRpb246IGFydGlmYWN0c0J1Y2tldC5idWNrZXQuczNVcmxGb3JPYmplY3QocHJlZml4KSxcbiAgICAgICAgICAgIGV4ZWN1dGlvblJvbGVBcm46IHRoaXMuY2FuYXJ5Um9sZS5yb2xlQXJuLFxuICAgICAgICAgICAgcnVudGltZVZlcnNpb246IHByb3BzLnJ1bnRpbWUubmFtZSxcbiAgICAgICAgICAgIG5hbWU6IHByb3BzLmNhbmFyeU5hbWUsXG4gICAgICAgICAgICBzY2hlZHVsZToge1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IHNjaGVkdWxlRXhwcmVzc1N0cmluZyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydENhbmFyeUFmdGVyQ3JlYXRpb246IHByb3BzLnN0YXJ0QWZ0ZXJDcmVhdGlvbiA/PyB0cnVlLFxuICAgICAgICAgICAgY29kZTogdGhpcy5jcmVhdGVDb2RlKHByb3BzLnRlc3QpLFxuICAgICAgICAgICAgcnVuQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgYWN0aXZlVHJhY2luZzogdHJ1ZSxcbiAgICAgICAgICAgICAgICB0aW1lb3V0SW5TZWNvbmRzOiBwcm9wcy50aW1lb3V0SW5TZWNvbmRzID8/IDE1LFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOiBwcm9wcy5lbnZpcm9ubWVudFZhcmlhYmxlcyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2cGNDb25maWcsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBjbG91ZHdhdGNoIGV2ZW50IHJ1bGUgdG8gc2VuZCBmYWlsZWQgYWxlcnQgdG8gU05TIHRvcGljXG4gICAgICAgIGlmIChwcm9wcy5hbGVydFNOU1RvcGljQXJuKSB7XG4gICAgICAgICAgICBjb25zdCBhbGVydFRvcGljID0gc25zLlRvcGljLmZyb21Ub3BpY0FybihcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgICdDYW5hcnlBbGVydFNOU1RvcGljJyxcbiAgICAgICAgICAgICAgICBwcm9wcy5hbGVydFNOU1RvcGljQXJuXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ0NhbmFyeVRlc3RFdmVudFJ1bGUnLCB7XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFdmVudCBydWxlIGZvciBtb25pdG9yaW5nIENhbmFyeSBUZXN0IFJlc3VsdHMnLFxuICAgICAgICAgICAgICAgIGV2ZW50UGF0dGVybjoge1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IFsnYXdzLnN5bnRoZXRpY3MnXSxcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsVHlwZTogWydTeW50aGV0aWNzIENhbmFyeSBUZXN0UnVuIEZhaWx1cmUnXSxcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnY2FuYXJ5LW5hbWUnOiBbcHJvcHMuY2FuYXJ5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAndGVzdC1ydW4tc3RhdHVzJzogWydGQUlMRUQnXSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRhcmdldHM6IFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IHRhcmdldHMuU25zVG9waWMoYWxlcnRUb3BpYywge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXZlbnRzLlJ1bGVUYXJnZXRJbnB1dC5mcm9tVGV4dChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgQ2FuYXJ5IHRlc3QgJHtwcm9wcy5jYW5hcnlOYW1lfSBmYWlsZWQgb24gaW4gYWNjb3VudCAke2Nkay5Bd3MuQUNDT1VOVF9JRH1gXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZUNvZGUodGVzdDogc3ludGhldGljcy5UZXN0KTogc3ludGhldGljcy5DZm5DYW5hcnkuQ29kZVByb3BlcnR5IHtcbiAgICAgICAgY29uc3QgY29kZUNvbmZpZyA9IHtcbiAgICAgICAgICAgIGhhbmRsZXI6IHRlc3QuaGFuZGxlcixcbiAgICAgICAgICAgIC4uLnRlc3QuY29kZS5iaW5kKHRoaXMsIHRlc3QuaGFuZGxlciksXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBoYW5kbGVyOiBjb2RlQ29uZmlnLmhhbmRsZXIsXG4gICAgICAgICAgICBzY3JpcHQ6IGNvZGVDb25maWcuaW5saW5lQ29kZSxcbiAgICAgICAgICAgIHMzQnVja2V0OiBjb2RlQ29uZmlnLnMzTG9jYXRpb24/LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBzM0tleTogY29kZUNvbmZpZy5zM0xvY2F0aW9uPy5vYmplY3RLZXksXG4gICAgICAgICAgICBzM09iamVjdFZlcnNpb246IGNvZGVDb25maWcuczNMb2NhdGlvbj8ub2JqZWN0VmVyc2lvbixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENhbmFyeVJvbGVQb2xpY3lEb2MoXG4gICAgICAgIGFydGlmYWN0c0J1Y2tldDogczMuSUJ1Y2tldCxcbiAgICAgICAgcHJlZml4OiBzdHJpbmdcbiAgICApOiBpYW0uUG9saWN5RG9jdW1lbnQge1xuICAgICAgICBjb25zdCB7IHBhcnRpdGlvbiB9ID0gY2RrLlN0YWNrLm9mKHRoaXMpO1xuICAgICAgICBjb25zdCBwb2xpY3kgPSBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnczM6TGlzdEFsbE15QnVja2V0cyddLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnRpZmFjdHNCdWNrZXQuYXJuRm9yT2JqZWN0cyhgJHtwcmVmaXggPyBwcmVmaXggKyAnLyonIDogJyonfWApLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3MzOlB1dE9iamVjdCcsICdzMzpHZXRCdWNrZXRMb2NhdGlvbiddLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYXJ0aWZhY3RzQnVja2V0LmJ1Y2tldEFybl0sXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnczM6R2V0QnVja2V0TG9jYXRpb24nXSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnY2xvdWR3YXRjaDpQdXRNZXRyaWNEYXRhJ10sXG4gICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczogeyAnY2xvdWR3YXRjaDpuYW1lc3BhY2UnOiAnQ2xvdWRXYXRjaFN5bnRoZXRpY3MnIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3hyYXk6UHV0VHJhY2VTZWdtZW50cyddLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYGFybjoke3BhcnRpdGlvbn06bG9nczo6OipgXSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHBvbGljeTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWVhc3VyZSB0aGUgbnVtYmVyIG9mIGZhaWxlZCBjYW5hcnkgcnVucyBvdmVyIGEgZ2l2ZW4gdGltZSBwZXJpb2QuXG4gICAgICpcbiAgICAgKiBEZWZhdWx0OiBzdW0gb3ZlciA1IG1pbnV0ZXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgbWV0cmljXG4gICAgICovXG4gICAgcHVibGljIG1ldHJpY0ZhaWxlZChvcHRpb25zPzogTWV0cmljT3B0aW9ucyk6IE1ldHJpYyB7XG4gICAgICAgIHJldHVybiBuZXcgTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0Nsb3VkV2F0Y2hTeW50aGV0aWNzJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdGYWlsZWQnLFxuICAgICAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgICAgICAgIENhbmFyeU5hbWU6IHRoaXMuY2FuYXJ5TmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgfSkuYXR0YWNoVG8odGhpcyk7XG4gICAgfVxufVxuIl19