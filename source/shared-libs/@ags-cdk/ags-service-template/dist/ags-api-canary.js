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
            },
        });
    }
}
exports.AGSApiCanary = AGSApiCanary;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLWFwaS1jYW5hcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYWdzLWFwaS1jYW5hcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRiwyQ0FBMkM7QUFDM0MsNERBQTREO0FBQzVELG1DQUFtQztBQUNuQywyQkFBMkI7QUFDM0IsMkRBQXNEO0FBQ3RELDJDQUF1QztBQTBCdkM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUVILE1BQWEsWUFBYSxTQUFRLHNCQUFTO0lBSXZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBcUI7O1FBQzNELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIseUNBQXlDO1FBQ3pDLE1BQU0sY0FBYyxHQUFHLElBQUksbUNBQWUsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDaEUsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUMzQyxDQUFDLENBQUM7UUFFSCwwQkFBMEI7UUFDMUIsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN6RCx1QkFBdUIsQ0FBQyxhQUFhLENBQ2pDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLHNCQUFzQixDQUFDO1lBQ2pDLFNBQVMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUNwRCxDQUFDLEVBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDO1lBQ3pCLFNBQVMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksQ0FBQztTQUN0RCxDQUFDLEVBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFO2dCQUNMLHNCQUFzQjtnQkFDdEIsbUJBQW1CO2dCQUNuQixxQkFBcUI7YUFDeEI7WUFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDbkIsQ0FBQyxFQUNGLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLHFCQUFxQixDQUFDO1lBQ2hDLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNuQixDQUFDLEVBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFLENBQUMsMEJBQTBCLENBQUM7WUFDckMsVUFBVSxFQUFFO2dCQUNSLFlBQVksRUFBRTtvQkFDVixzQkFBc0IsRUFBRSxzQkFBc0I7aUJBQ2pEO2FBQ0o7WUFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDbkIsQ0FBQyxDQUNMLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3BELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7WUFDN0MsY0FBYyxFQUFFO2dCQUNaLGVBQWUsRUFBRSx1QkFBdUI7YUFDM0M7WUFDRCxXQUFXLEVBQUUsbUNBQW1DO1NBQ25ELENBQUMsQ0FBQztRQUVILGdCQUFnQjtRQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO1lBQzFDLHVCQUF1QixFQUFFLEVBQUUsTUFBTSxFQUFFLGNBQWMsQ0FBQyxNQUFNLEVBQUU7WUFDMUQsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ3JCLE9BQU8sRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLCtCQUErQjtZQUMzRCxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ3pCLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FDdkQ7Z0JBQ0QsT0FBTyxFQUFFLGVBQWU7YUFDM0IsQ0FBQztZQUNGLFVBQVUsUUFBRSxLQUFLLENBQUMsVUFBVSxtQ0FBSSxHQUFHLEVBQUUsVUFBVTtZQUMvQyxRQUFRLFFBQ0osS0FBSyxDQUFDLGlCQUFpQixtQ0FDdkIsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckQsa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixvQkFBb0IsRUFBRTtnQkFDbEIsZUFBZSxFQUFFLEtBQUssQ0FBQyxNQUFNO2dCQUM3QixHQUFHLEtBQUssQ0FBQyxtQkFBbUI7YUFDL0I7U0FDSixDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFsRkQsb0NBa0ZDIiwic291cmNlc0NvbnRlbnQiOlsiLyogXG4gIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICBcbiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKS5cbiAgWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgXG4gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgXG4gIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzeW50aGV0aWNzIGZyb20gJ0Bhd3MtY2RrL2F3cy1zeW50aGV0aWNzLWFscGhhJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBmaWxlIGZyb20gJ2ZzJztcbmltcG9ydCB7IEFnc1NlY3VyZUJ1Y2tldCB9IGZyb20gJy4vYWdzLXNlY3VyZS1idWNrZXQnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUdTQ2FuYXJ5UHJvcHMge1xuICAgIC8qKlxuICAgICAqIFVSTCBvZiB0aGUgdGFyZ2V0IGFwaSBmb3IgdGVzdGluZyBzY3JpcHQuXG4gICAgICovXG4gICAgcmVhZG9ubHkgYXBpVXJsOiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogcGF0aCB0byBjYW5hcnkgc291cmNlXG4gICAgICovXG4gICAgcmVhZG9ubHkgY2FuYXJ5U291cmNlUGF0aDogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIG9wdGlvbmFsIC0gY2FuYXJ5IG5hbWUsIGlmIG5vdCBwcmVzZW50IHdpbGwgdXNlIGlkICsgY2FuYXJ5IGluc3RlYWRcbiAgICAgKi9cbiAgICByZWFkb25seSBjYW5hcnlOYW1lPzogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIG9wdGlvbmFsIC0gc2NoZWR1bGUgY2FuYXJ5LCB1bml0IFNjaGVkdWxlIHtAbGluayBodHRwczovL2F3c2Nkay5pby9wYWNrYWdlcy9AYXdzLWNkay9hd3Mtc3ludGhldGljc0AxLjkzLjAvIy8uL0Bhd3MtY2RrX2F3cy1zeW50aGV0aWNzLlNjaGVkdWxlIH1cbiAgICAgKiBEZWZhdWx0IHZhbHVlIC0gNSBtaW5zXG4gICAgICovXG4gICAgcmVhZG9ubHkgc2NoZWR1bGVGb3JDYW5hcnk/OiBzeW50aGV0aWNzLlNjaGVkdWxlO1xuICAgIC8qKlxuICAgICAqIG9wdGlvbmFsIC0gYWRkaXRpb25hbCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgcGFzc2luZyBpbnRvIGNhbmFyeVxuICAgICAqIERlZmF1bHQgdmFsdWUgLSBuL2FcbiAgICAgKi9cbiAgICByZWFkb25seSBlbnZpcm9ubWVudFZhcmlhYmxlPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cbi8qKlxuICogVGhpIGNvbnN0cnVjdCBjcmVhdGVzIGEgZ2VuZXJpYyBjYW5hcnkgdG8gZXhlY3V0aW5nIHRlc3QgYWdhaW5zdCBjb25maWd1cmVkIGVuZHBvaW50XG4gKiBAcmVtYXJrc1xuICogQ29kZSBzYW1wbGVzXG4gKiBjb25zdCBhcGlDYW5hcnkgPSBuZXcgQXBpQ2FuYXJ5KHRoaXMsICdhcGktY2FuYXJ5Jywge1xuICogICAgICAgICAgIGFwaVVybDogYXBpLmFwaS51cmwsXG4gKiAgICAgICAgICAgYXBpSWQ6IGFwaS5hcGkucmVzdEFwaUlkLFxuICogICAgICAgICAgIGNhbmFyeVNvdXJjZVJlbGF0aXZlUGF0aDogJy4uLy4uL2FwcC9sYW1iZGEvLmF3cy1zYW0vYnVpbGQvY2FuYXJ5L2luZGV4LmpzJyxcbiAqICAgICAgIH0pO1xuICogLy8gaW4gYWRkaXRpb25hbCBkdWUgdG8gYSBjaXJjdXJhbCBkZXBlbmRlbmN5IGlzc3VlLCB5b3UgbmVlZCB0byBhZGQgdGhlIHBlcm1pc3Npb24gZm9yIHRoZSBjYW5hcnkgbGFtYmRhXG4gKiAvLyB0byBjYWxsIHRoZSB0YXJnZXQgT1VUU0lERVxuICogYXBpQ2FuYXJ5LmNhbmFyeVJvbGUuYWRkVG9Qb2xpY3koXG4gKiAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICogICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gKiAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnYXBpZ2F0ZXdheToqJ10sXG4gKiAgICAgICAgICAgICAgIHJlc291cmNlczogW1xuICogICAgICAgICAgICAgICAgICAgIGBhcm46YXdzOmFwaWdhdGV3YXk6JHtzdGFjay5yZWdpb259OjovcmVzdGFwaXMvJHthcGkuYXBpLnJlc3RBcGlJZH0vKmAsXG4gKiAgICAgICAgICAgICAgXSxcbiAqICAgICAgICAgICB9KVxuICogICAgICApO1xuICogYGBgXG4gKi9cblxuZXhwb3J0IGNsYXNzIEFHU0FwaUNhbmFyeSBleHRlbmRzIENvbnN0cnVjdCB7XG4gICAgcHVibGljIHJlYWRvbmx5IGNhbmFyeTogc3ludGhldGljcy5DYW5hcnk7XG4gICAgcHVibGljIHJlYWRvbmx5IGNhbmFyeVJvbGU6IGlhbS5Sb2xlO1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFHU0NhbmFyeVByb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAgICAgLy8gY3JlYXRlIHMzIGJ1Y2tldCBmb3IgY2FuYXJ5IGxvZyBvdXRwdXRcbiAgICAgICAgY29uc3QgY2FuYXJ5UzNCdWNrZXQgPSBuZXcgQWdzU2VjdXJlQnVja2V0KHRoaXMsIGBhcGktY2FuYXJ5LWxvZ3NgLCB7XG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjcmVhdGUgcG9saWN5IHN0YXRlbWVudFxuICAgICAgICBjb25zdCBjYW5hcnlJYW1Qb2xpY3lEb2N1bWVudCA9IG5ldyBpYW0uUG9saWN5RG9jdW1lbnQoKTtcbiAgICAgICAgY2FuYXJ5SWFtUG9saWN5RG9jdW1lbnQuYWRkU3RhdGVtZW50cyhcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgYWN0aW9uczogWydzMzpHZXRCdWNrZXRMb2NhdGlvbiddLFxuICAgICAgICAgICAgICAgIHJlc291cmNlczogW2Ake2NhbmFyeVMzQnVja2V0LmJ1Y2tldC5idWNrZXRBcm59YF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgYWN0aW9uczogWydzMzpQdXRPYmplY3QnXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtgJHtjYW5hcnlTM0J1Y2tldC5idWNrZXQuYnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAgICAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnczM6TGlzdEFsbE15QnVja2V0cyddLFxuICAgICAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgYWN0aW9uczogWydjbG91ZHdhdGNoOlB1dE1ldHJpY0RhdGEnXSxcbiAgICAgICAgICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2Nsb3Vkd2F0Y2g6bmFtZXNwYWNlJzogJ0Nsb3VkV2F0Y2hTeW50aGV0aWNzJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBjYW5hcnkgZXhlY3V0aW9uIHJvbGVcbiAgICAgICAgdGhpcy5jYW5hcnlSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsIGBhcGktY2FuYXJ5LXJvbGVgLCB7XG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhJyksXG4gICAgICAgICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICAgICAgICAgIENhbmFyeUlhbVBvbGljeTogY2FuYXJ5SWFtUG9saWN5RG9jdW1lbnQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeGVjdXRpb24gcm9sZSBmb3IgdGhlIGFwaSBjYW5hcnknLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjcmVhdGUgY2FuYXJ5XG4gICAgICAgIHRoaXMuY2FuYXJ5ID0gbmV3IHN5bnRoZXRpY3MuQ2FuYXJ5KHRoaXMsIGlkLCB7XG4gICAgICAgICAgICBhcnRpZmFjdHNCdWNrZXRMb2NhdGlvbjogeyBidWNrZXQ6IGNhbmFyeVMzQnVja2V0LmJ1Y2tldCB9LFxuICAgICAgICAgICAgcm9sZTogdGhpcy5jYW5hcnlSb2xlLFxuICAgICAgICAgICAgcnVudGltZTogc3ludGhldGljcy5SdW50aW1lLlNZTlRIRVRJQ1NfTk9ERUpTX1BVUFBFVEVFUl8zXzAsXG4gICAgICAgICAgICB0ZXN0OiBzeW50aGV0aWNzLlRlc3QuY3VzdG9tKHtcbiAgICAgICAgICAgICAgICBjb2RlOiBzeW50aGV0aWNzLkNvZGUuZnJvbUlubGluZShcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5yZWFkRmlsZVN5bmMocHJvcHMuY2FuYXJ5U291cmNlUGF0aCkudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjYW5hcnlOYW1lOiBwcm9wcy5jYW5hcnlOYW1lID8/IGAke2lkfS1jYW5uYXJ5YCxcbiAgICAgICAgICAgIHNjaGVkdWxlOlxuICAgICAgICAgICAgICAgIHByb3BzLnNjaGVkdWxlRm9yQ2FuYXJ5ID8/XG4gICAgICAgICAgICAgICAgc3ludGhldGljcy5TY2hlZHVsZS5yYXRlKGNkay5EdXJhdGlvbi5taW51dGVzKDUpKSxcbiAgICAgICAgICAgIHN0YXJ0QWZ0ZXJDcmVhdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgVEVTVF9UQVJHRVRfQVBJOiBwcm9wcy5hcGlVcmwsXG4gICAgICAgICAgICAgICAgLi4ucHJvcHMuZW52aXJvbm1lbnRWYXJpYWJsZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==