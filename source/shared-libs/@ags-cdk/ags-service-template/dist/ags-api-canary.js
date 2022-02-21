"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGSApiCanary = void 0;
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
const iam = require("aws-cdk-lib/aws-iam");
const synthetics = require("@aws-cdk/aws-synthetics-alpha");
const cdk = require("aws-cdk-lib");
const file = require("fs");
const ags_secure_bucket_1 = require("./ags-secure-bucket");
const constructs_1 = require("constructs");
/**
 * Thi construct creates a generic canary to executing test against configured endpoint
 * @remarks
 * Code samples
 * const apiCanary = new ApiCanary(this, 'api-canary', {
 *           apiUrl: api.api.url,
 *           apiId: api.api.restApiId,
 *           canarySourceRelativePath: '../../app/lambda/.aws-sam/build/canary/index.js',
 *       });
 * // in additional due to a circural dependency issue, you need to add the permission for the canary lambda
 * // to call the target OUTSIDE
 * apiCanary.canaryRole.addToPolicy(
 *           new iam.PolicyStatement({
 *               effect: iam.Effect.ALLOW,
 *               actions: ['apigateway:*'],
 *               resources: [
 *                    `arn:aws:apigateway:${stack.region}::/restapis/${api.api.restApiId}/*`,
 *              ],
 *           })
 *      );
 * ```
 */
class AGSApiCanary extends constructs_1.Construct {
    constructor(scope, id, props) {
        var _a, _b;
        super(scope, id);
        // create s3 bucket for canary log output
        const canaryS3Bucket = new ags_secure_bucket_1.AgsSecureBucket(this, `api-canary-logs`, {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // create policy statement
        const canaryIamPolicyDocument = new iam.PolicyDocument();
        canaryIamPolicyDocument.addStatements(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetBucketLocation'],
            resources: [`${canaryS3Bucket.bucket.bucketArn}`],
        }), new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:PutObject'],
            resources: [`${canaryS3Bucket.bucket.bucketArn}/*`],
        }), new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
            ],
            resources: ['*'],
        }), new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:ListAllMyBuckets'],
            resources: ['*'],
        }), new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['cloudwatch:PutMetricData'],
            conditions: {
                StringEquals: {
                    'cloudwatch:namespace': 'CloudWatchSynthetics',
                },
            },
            resources: ['*'],
        }));
        // create canary execution role
        this.canaryRole = new iam.Role(this, `api-canary-role`, {
            assumedBy: new iam.ServicePrincipal('lambda'),
            inlinePolicies: {
                CanaryIamPolicy: canaryIamPolicyDocument,
            },
            description: 'Execution role for the api canary',
        });
        // create canary
        this.canary = new synthetics.Canary(this, id, {
            artifactsBucketLocation: { bucket: canaryS3Bucket.bucket },
            role: this.canaryRole,
            runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_0,
            test: synthetics.Test.custom({
                code: synthetics.Code.fromInline(file.readFileSync(props.canarySourcePath).toString()),
                handler: 'index.handler',
            }),
            canaryName: (_a = props.canaryName) !== null && _a !== void 0 ? _a : `${id}-cannary`,
            schedule: (_b = props.scheduleForCanary) !== null && _b !== void 0 ? _b : synthetics.Schedule.rate(cdk.Duration.minutes(5)),
            startAfterCreation: true,
            environmentVariables: {
                TEST_TARGET_API: props.apiUrl,
                ...props.environmentVariable,
            }
        });
    }
}
exports.AGSApiCanary = AGSApiCanary;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLWFwaS1jYW5hcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYWdzLWFwaS1jYW5hcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRiwyQ0FBMkM7QUFDM0MsNERBQTREO0FBQzVELG1DQUFtQztBQUNuQywyQkFBMkI7QUFDM0IsMkRBQXNEO0FBQ3RELDJDQUF1QztBQTBCdkM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUVILE1BQWEsWUFBYSxTQUFRLHNCQUFTO0lBSXZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBcUI7O1FBQzNELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIseUNBQXlDO1FBQ3pDLE1BQU0sY0FBYyxHQUFHLElBQUksbUNBQWUsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDaEUsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUMzQyxDQUFDLENBQUM7UUFFSCwwQkFBMEI7UUFDMUIsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN6RCx1QkFBdUIsQ0FBQyxhQUFhLENBQ2pDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLHNCQUFzQixDQUFDO1lBQ2pDLFNBQVMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUNwRCxDQUFDLEVBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDO1lBQ3pCLFNBQVMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksQ0FBQztTQUN0RCxDQUFDLEVBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFO2dCQUNMLHNCQUFzQjtnQkFDdEIsbUJBQW1CO2dCQUNuQixxQkFBcUI7YUFDeEI7WUFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDbkIsQ0FBQyxFQUNGLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLHFCQUFxQixDQUFDO1lBQ2hDLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNuQixDQUFDLEVBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFLENBQUMsMEJBQTBCLENBQUM7WUFDckMsVUFBVSxFQUFFO2dCQUNSLFlBQVksRUFBRTtvQkFDVixzQkFBc0IsRUFBRSxzQkFBc0I7aUJBQ2pEO2FBQ0o7WUFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDbkIsQ0FBQyxDQUNMLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3BELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7WUFDN0MsY0FBYyxFQUFFO2dCQUNaLGVBQWUsRUFBRSx1QkFBdUI7YUFDM0M7WUFDRCxXQUFXLEVBQUUsbUNBQW1DO1NBQ25ELENBQUMsQ0FBQztRQUVILGdCQUFnQjtRQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO1lBQzFDLHVCQUF1QixFQUFFLEVBQUUsTUFBTSxFQUFFLGNBQWMsQ0FBQyxNQUFNLEVBQUU7WUFDMUQsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ3JCLE9BQU8sRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLCtCQUErQjtZQUMzRCxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ3pCLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FDdkQ7Z0JBQ0QsT0FBTyxFQUFFLGVBQWU7YUFDM0IsQ0FBQztZQUNGLFVBQVUsUUFBRSxLQUFLLENBQUMsVUFBVSxtQ0FBSSxHQUFHLEVBQUUsVUFBVTtZQUMvQyxRQUFRLFFBQ0osS0FBSyxDQUFDLGlCQUFpQixtQ0FBSSxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLG9CQUFvQixFQUFDO2dCQUNqQixlQUFlLEVBQUUsS0FBSyxDQUFDLE1BQU07Z0JBQzdCLEdBQUcsS0FBSyxDQUFDLG1CQUFtQjthQUMvQjtTQUNKLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQWpGRCxvQ0FpRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHN5bnRoZXRpY3MgZnJvbSAnQGF3cy1jZGsvYXdzLXN5bnRoZXRpY3MtYWxwaGEnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGZpbGUgZnJvbSAnZnMnO1xuaW1wb3J0IHsgQWdzU2VjdXJlQnVja2V0IH0gZnJvbSAnLi9hZ3Mtc2VjdXJlLWJ1Y2tldCc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBBR1NDYW5hcnlQcm9wcyB7XG4gICAgLyoqXG4gICAgICogVVJMIG9mIHRoZSB0YXJnZXQgYXBpIGZvciB0ZXN0aW5nIHNjcmlwdC5cbiAgICAgKi9cbiAgICByZWFkb25seSBhcGlVcmw6IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBwYXRoIHRvIGNhbmFyeSBzb3VyY2VcbiAgICAgKi9cbiAgICByZWFkb25seSBjYW5hcnlTb3VyY2VQYXRoOiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogb3B0aW9uYWwgLSBjYW5hcnkgbmFtZSwgaWYgbm90IHByZXNlbnQgd2lsbCB1c2UgaWQgKyBjYW5hcnkgaW5zdGVhZFxuICAgICAqL1xuICAgIHJlYWRvbmx5IGNhbmFyeU5hbWU/OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogb3B0aW9uYWwgLSBzY2hlZHVsZSBjYW5hcnksIHVuaXQgU2NoZWR1bGUge0BsaW5rIGh0dHBzOi8vYXdzY2RrLmlvL3BhY2thZ2VzL0Bhd3MtY2RrL2F3cy1zeW50aGV0aWNzQDEuOTMuMC8jLy4vQGF3cy1jZGtfYXdzLXN5bnRoZXRpY3MuU2NoZWR1bGUgfVxuICAgICAqIERlZmF1bHQgdmFsdWUgLSA1IG1pbnNcbiAgICAgKi9cbiAgICByZWFkb25seSBzY2hlZHVsZUZvckNhbmFyeT86IHN5bnRoZXRpY3MuU2NoZWR1bGU7XG4gICAgLyoqXG4gICAgICogb3B0aW9uYWwgLSBhZGRpdGlvbmFsIGVudmlyb25tZW50IHZhcmlhYmxlcyBwYXNzaW5nIGludG8gY2FuYXJ5XG4gICAgICogRGVmYXVsdCB2YWx1ZSAtIG4vYVxuICAgICAqL1xuICAgIHJlYWRvbmx5IGVudmlyb25tZW50VmFyaWFibGU/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuLyoqXG4gKiBUaGkgY29uc3RydWN0IGNyZWF0ZXMgYSBnZW5lcmljIGNhbmFyeSB0byBleGVjdXRpbmcgdGVzdCBhZ2FpbnN0IGNvbmZpZ3VyZWQgZW5kcG9pbnRcbiAqIEByZW1hcmtzXG4gKiBDb2RlIHNhbXBsZXNcbiAqIGNvbnN0IGFwaUNhbmFyeSA9IG5ldyBBcGlDYW5hcnkodGhpcywgJ2FwaS1jYW5hcnknLCB7XG4gKiAgICAgICAgICAgYXBpVXJsOiBhcGkuYXBpLnVybCxcbiAqICAgICAgICAgICBhcGlJZDogYXBpLmFwaS5yZXN0QXBpSWQsXG4gKiAgICAgICAgICAgY2FuYXJ5U291cmNlUmVsYXRpdmVQYXRoOiAnLi4vLi4vYXBwL2xhbWJkYS8uYXdzLXNhbS9idWlsZC9jYW5hcnkvaW5kZXguanMnLFxuICogICAgICAgfSk7XG4gKiAvLyBpbiBhZGRpdGlvbmFsIGR1ZSB0byBhIGNpcmN1cmFsIGRlcGVuZGVuY3kgaXNzdWUsIHlvdSBuZWVkIHRvIGFkZCB0aGUgcGVybWlzc2lvbiBmb3IgdGhlIGNhbmFyeSBsYW1iZGFcbiAqIC8vIHRvIGNhbGwgdGhlIHRhcmdldCBPVVRTSURFXG4gKiBhcGlDYW5hcnkuY2FuYXJ5Um9sZS5hZGRUb1BvbGljeShcbiAqICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gKiAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAqICAgICAgICAgICAgICAgYWN0aW9uczogWydhcGlnYXRld2F5OionXSxcbiAqICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gKiAgICAgICAgICAgICAgICAgICAgYGFybjphd3M6YXBpZ2F0ZXdheToke3N0YWNrLnJlZ2lvbn06Oi9yZXN0YXBpcy8ke2FwaS5hcGkucmVzdEFwaUlkfS8qYCxcbiAqICAgICAgICAgICAgICBdLFxuICogICAgICAgICAgIH0pXG4gKiAgICAgICk7XG4gKiBgYGBcbiAqL1xuXG5leHBvcnQgY2xhc3MgQUdTQXBpQ2FuYXJ5IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2FuYXJ5OiBzeW50aGV0aWNzLkNhbmFyeTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2FuYXJ5Um9sZTogaWFtLlJvbGU7XG5cbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQUdTQ2FuYXJ5UHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICAvLyBjcmVhdGUgczMgYnVja2V0IGZvciBjYW5hcnkgbG9nIG91dHB1dFxuICAgICAgICBjb25zdCBjYW5hcnlTM0J1Y2tldCA9IG5ldyBBZ3NTZWN1cmVCdWNrZXQodGhpcywgYGFwaS1jYW5hcnktbG9nc2AsIHtcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBwb2xpY3kgc3RhdGVtZW50XG4gICAgICAgIGNvbnN0IGNhbmFyeUlhbVBvbGljeURvY3VtZW50ID0gbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCgpO1xuICAgICAgICBjYW5hcnlJYW1Qb2xpY3lEb2N1bWVudC5hZGRTdGF0ZW1lbnRzKFxuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldEJ1Y2tldExvY2F0aW9uJ10sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYCR7Y2FuYXJ5UzNCdWNrZXQuYnVja2V0LmJ1Y2tldEFybn1gXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3MzOlB1dE9iamVjdCddLFxuICAgICAgICAgICAgICAgIHJlc291cmNlczogW2Ake2NhbmFyeVMzQnVja2V0LmJ1Y2tldC5idWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICAgICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgYWN0aW9uczogWydzMzpMaXN0QWxsTXlCdWNrZXRzJ10sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ2Nsb3Vkd2F0Y2g6UHV0TWV0cmljRGF0YSddLFxuICAgICAgICAgICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnY2xvdWR3YXRjaDpuYW1lc3BhY2UnOiAnQ2xvdWRXYXRjaFN5bnRoZXRpY3MnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gY3JlYXRlIGNhbmFyeSBleGVjdXRpb24gcm9sZVxuICAgICAgICB0aGlzLmNhbmFyeVJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgYGFwaS1jYW5hcnktcm9sZWAsIHtcbiAgICAgICAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEnKSxcbiAgICAgICAgICAgIGlubGluZVBvbGljaWVzOiB7XG4gICAgICAgICAgICAgICAgQ2FuYXJ5SWFtUG9saWN5OiBjYW5hcnlJYW1Qb2xpY3lEb2N1bWVudCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0V4ZWN1dGlvbiByb2xlIGZvciB0aGUgYXBpIGNhbmFyeScsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBjYW5hcnlcbiAgICAgICAgdGhpcy5jYW5hcnkgPSBuZXcgc3ludGhldGljcy5DYW5hcnkodGhpcywgaWQsIHtcbiAgICAgICAgICAgIGFydGlmYWN0c0J1Y2tldExvY2F0aW9uOiB7IGJ1Y2tldDogY2FuYXJ5UzNCdWNrZXQuYnVja2V0IH0sXG4gICAgICAgICAgICByb2xlOiB0aGlzLmNhbmFyeVJvbGUsXG4gICAgICAgICAgICBydW50aW1lOiBzeW50aGV0aWNzLlJ1bnRpbWUuU1lOVEhFVElDU19OT0RFSlNfUFVQUEVURUVSXzNfMCxcbiAgICAgICAgICAgIHRlc3Q6IHN5bnRoZXRpY3MuVGVzdC5jdXN0b20oe1xuICAgICAgICAgICAgICAgIGNvZGU6IHN5bnRoZXRpY3MuQ29kZS5mcm9tSW5saW5lKFxuICAgICAgICAgICAgICAgICAgICBmaWxlLnJlYWRGaWxlU3luYyhwcm9wcy5jYW5hcnlTb3VyY2VQYXRoKS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNhbmFyeU5hbWU6IHByb3BzLmNhbmFyeU5hbWUgPz8gYCR7aWR9LWNhbm5hcnlgLFxuICAgICAgICAgICAgc2NoZWR1bGU6XG4gICAgICAgICAgICAgICAgcHJvcHMuc2NoZWR1bGVGb3JDYW5hcnkgPz8gc3ludGhldGljcy5TY2hlZHVsZS5yYXRlKGNkay5EdXJhdGlvbi5taW51dGVzKDUpKSxcbiAgICAgICAgICAgIHN0YXJ0QWZ0ZXJDcmVhdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOntcbiAgICAgICAgICAgICAgICBURVNUX1RBUkdFVF9BUEk6IHByb3BzLmFwaVVybCxcbiAgICAgICAgICAgICAgICAuLi5wcm9wcy5lbnZpcm9ubWVudFZhcmlhYmxlLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=