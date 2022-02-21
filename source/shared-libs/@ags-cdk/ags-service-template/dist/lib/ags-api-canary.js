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
const iam = require("@aws-cdk/aws-iam");
const synthetics = require("@aws-cdk/aws-synthetics");
const cdk = require("@aws-cdk/core");
const core_1 = require("@aws-cdk/core");
const file = require("fs");
const ags_secure_bucket_1 = require("./ags-secure-bucket");
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
class AGSApiCanary extends cdk.Construct {
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
            schedule: (_b = props.scheduleForCanary) !== null && _b !== void 0 ? _b : synthetics.Schedule.rate(core_1.Duration.minutes(5)),
            startAfterCreation: true,
        });
        const child = this.canary.node.defaultChild;
        child.addPropertyOverride('RunConfig.EnvironmentVariables', {
            TEST_TARGET_API: props.apiUrl,
            ...props.environmentVariable,
        });
    }
}
exports.AGSApiCanary = AGSApiCanary;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLWFwaS1jYW5hcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvYWdzLWFwaS1jYW5hcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRix3Q0FBd0M7QUFDeEMsc0RBQXNEO0FBQ3RELHFDQUFxQztBQUNyQyx3Q0FBeUM7QUFDekMsMkJBQTJCO0FBQzNCLDJEQUFzRDtBQXlCdEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUVILE1BQWEsWUFBYSxTQUFRLEdBQUcsQ0FBQyxTQUFTO0lBSTNDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBcUI7O1FBQy9ELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIseUNBQXlDO1FBQ3pDLE1BQU0sY0FBYyxHQUFHLElBQUksbUNBQWUsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDaEUsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUMzQyxDQUFDLENBQUM7UUFFSCwwQkFBMEI7UUFDMUIsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN6RCx1QkFBdUIsQ0FBQyxhQUFhLENBQ2pDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLHNCQUFzQixDQUFDO1lBQ2pDLFNBQVMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUNwRCxDQUFDLEVBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDO1lBQ3pCLFNBQVMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksQ0FBQztTQUN0RCxDQUFDLEVBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFO2dCQUNMLHNCQUFzQjtnQkFDdEIsbUJBQW1CO2dCQUNuQixxQkFBcUI7YUFDeEI7WUFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDbkIsQ0FBQyxFQUNGLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLHFCQUFxQixDQUFDO1lBQ2hDLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNuQixDQUFDLEVBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFLENBQUMsMEJBQTBCLENBQUM7WUFDckMsVUFBVSxFQUFFO2dCQUNSLFlBQVksRUFBRTtvQkFDVixzQkFBc0IsRUFBRSxzQkFBc0I7aUJBQ2pEO2FBQ0o7WUFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDbkIsQ0FBQyxDQUNMLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3BELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7WUFDN0MsY0FBYyxFQUFFO2dCQUNaLGVBQWUsRUFBRSx1QkFBdUI7YUFDM0M7WUFDRCxXQUFXLEVBQUUsbUNBQW1DO1NBQ25ELENBQUMsQ0FBQztRQUVILGdCQUFnQjtRQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO1lBQzFDLHVCQUF1QixFQUFFLEVBQUUsTUFBTSxFQUFFLGNBQWMsQ0FBQyxNQUFNLEVBQUU7WUFDMUQsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ3JCLE9BQU8sRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLCtCQUErQjtZQUMzRCxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ3pCLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FDdkQ7Z0JBQ0QsT0FBTyxFQUFFLGVBQWU7YUFDM0IsQ0FBQztZQUNGLFVBQVUsUUFBRSxLQUFLLENBQUMsVUFBVSxtQ0FBSSxHQUFHLEVBQUUsVUFBVTtZQUMvQyxRQUFRLFFBQ0osS0FBSyxDQUFDLGlCQUFpQixtQ0FBSSxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVFLGtCQUFrQixFQUFFLElBQUk7U0FDM0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBb0MsQ0FBQztRQUNwRSxLQUFLLENBQUMsbUJBQW1CLENBQUMsZ0NBQWdDLEVBQUU7WUFDeEQsZUFBZSxFQUFFLEtBQUssQ0FBQyxNQUFNO1lBQzdCLEdBQUcsS0FBSyxDQUFDLG1CQUFtQjtTQUMvQixDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFuRkQsb0NBbUZDIiwic291cmNlc0NvbnRlbnQiOlsiLyogXG4gIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICBcbiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKS5cbiAgWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgXG4gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgXG4gIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzeW50aGV0aWNzIGZyb20gJ0Bhd3MtY2RrL2F3cy1zeW50aGV0aWNzJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IER1cmF0aW9uIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBmaWxlIGZyb20gJ2ZzJztcbmltcG9ydCB7IEFnc1NlY3VyZUJ1Y2tldCB9IGZyb20gJy4vYWdzLXNlY3VyZS1idWNrZXQnO1xuZXhwb3J0IGludGVyZmFjZSBBR1NDYW5hcnlQcm9wcyB7XG4gICAgLyoqXG4gICAgICogVVJMIG9mIHRoZSB0YXJnZXQgYXBpIGZvciB0ZXN0aW5nIHNjcmlwdC5cbiAgICAgKi9cbiAgICByZWFkb25seSBhcGlVcmw6IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBwYXRoIHRvIGNhbmFyeSBzb3VyY2VcbiAgICAgKi9cbiAgICByZWFkb25seSBjYW5hcnlTb3VyY2VQYXRoOiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogb3B0aW9uYWwgLSBjYW5hcnkgbmFtZSwgaWYgbm90IHByZXNlbnQgd2lsbCB1c2UgaWQgKyBjYW5hcnkgaW5zdGVhZFxuICAgICAqL1xuICAgIHJlYWRvbmx5IGNhbmFyeU5hbWU/OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogb3B0aW9uYWwgLSBzY2hlZHVsZSBjYW5hcnksIHVuaXQgU2NoZWR1bGUge0BsaW5rIGh0dHBzOi8vYXdzY2RrLmlvL3BhY2thZ2VzL0Bhd3MtY2RrL2F3cy1zeW50aGV0aWNzQDEuOTMuMC8jLy4vQGF3cy1jZGtfYXdzLXN5bnRoZXRpY3MuU2NoZWR1bGUgfVxuICAgICAqIERlZmF1bHQgdmFsdWUgLSA1IG1pbnNcbiAgICAgKi9cbiAgICByZWFkb25seSBzY2hlZHVsZUZvckNhbmFyeT86IHN5bnRoZXRpY3MuU2NoZWR1bGU7XG4gICAgLyoqXG4gICAgICogb3B0aW9uYWwgLSBhZGRpdGlvbmFsIGVudmlyb25tZW50IHZhcmlhYmxlcyBwYXNzaW5nIGludG8gY2FuYXJ5XG4gICAgICogRGVmYXVsdCB2YWx1ZSAtIG4vYVxuICAgICAqL1xuICAgIHJlYWRvbmx5IGVudmlyb25tZW50VmFyaWFibGU/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuLyoqXG4gKiBUaGkgY29uc3RydWN0IGNyZWF0ZXMgYSBnZW5lcmljIGNhbmFyeSB0byBleGVjdXRpbmcgdGVzdCBhZ2FpbnN0IGNvbmZpZ3VyZWQgZW5kcG9pbnRcbiAqIEByZW1hcmtzXG4gKiBDb2RlIHNhbXBsZXNcbiAqIGNvbnN0IGFwaUNhbmFyeSA9IG5ldyBBcGlDYW5hcnkodGhpcywgJ2FwaS1jYW5hcnknLCB7XG4gKiAgICAgICAgICAgYXBpVXJsOiBhcGkuYXBpLnVybCxcbiAqICAgICAgICAgICBhcGlJZDogYXBpLmFwaS5yZXN0QXBpSWQsXG4gKiAgICAgICAgICAgY2FuYXJ5U291cmNlUmVsYXRpdmVQYXRoOiAnLi4vLi4vYXBwL2xhbWJkYS8uYXdzLXNhbS9idWlsZC9jYW5hcnkvaW5kZXguanMnLFxuICogICAgICAgfSk7XG4gKiAvLyBpbiBhZGRpdGlvbmFsIGR1ZSB0byBhIGNpcmN1cmFsIGRlcGVuZGVuY3kgaXNzdWUsIHlvdSBuZWVkIHRvIGFkZCB0aGUgcGVybWlzc2lvbiBmb3IgdGhlIGNhbmFyeSBsYW1iZGFcbiAqIC8vIHRvIGNhbGwgdGhlIHRhcmdldCBPVVRTSURFXG4gKiBhcGlDYW5hcnkuY2FuYXJ5Um9sZS5hZGRUb1BvbGljeShcbiAqICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gKiAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAqICAgICAgICAgICAgICAgYWN0aW9uczogWydhcGlnYXRld2F5OionXSxcbiAqICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gKiAgICAgICAgICAgICAgICAgICAgYGFybjphd3M6YXBpZ2F0ZXdheToke3N0YWNrLnJlZ2lvbn06Oi9yZXN0YXBpcy8ke2FwaS5hcGkucmVzdEFwaUlkfS8qYCxcbiAqICAgICAgICAgICAgICBdLFxuICogICAgICAgICAgIH0pXG4gKiAgICAgICk7XG4gKiBgYGBcbiAqL1xuXG5leHBvcnQgY2xhc3MgQUdTQXBpQ2FuYXJ5IGV4dGVuZHMgY2RrLkNvbnN0cnVjdCB7XG4gICAgcHVibGljIHJlYWRvbmx5IGNhbmFyeTogc3ludGhldGljcy5DYW5hcnk7XG4gICAgcHVibGljIHJlYWRvbmx5IGNhbmFyeVJvbGU6IGlhbS5Sb2xlO1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBR1NDYW5hcnlQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBzMyBidWNrZXQgZm9yIGNhbmFyeSBsb2cgb3V0cHV0XG4gICAgICAgIGNvbnN0IGNhbmFyeVMzQnVja2V0ID0gbmV3IEFnc1NlY3VyZUJ1Y2tldCh0aGlzLCBgYXBpLWNhbmFyeS1sb2dzYCwge1xuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gY3JlYXRlIHBvbGljeSBzdGF0ZW1lbnRcbiAgICAgICAgY29uc3QgY2FuYXJ5SWFtUG9saWN5RG9jdW1lbnQgPSBuZXcgaWFtLlBvbGljeURvY3VtZW50KCk7XG4gICAgICAgIGNhbmFyeUlhbVBvbGljeURvY3VtZW50LmFkZFN0YXRlbWVudHMoXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnczM6R2V0QnVja2V0TG9jYXRpb24nXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtgJHtjYW5hcnlTM0J1Y2tldC5idWNrZXQuYnVja2V0QXJufWBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnczM6UHV0T2JqZWN0J10sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYCR7Y2FuYXJ5UzNCdWNrZXQuYnVja2V0LmJ1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nR3JvdXAnLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3MzOkxpc3RBbGxNeUJ1Y2tldHMnXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnY2xvdWR3YXRjaDpQdXRNZXRyaWNEYXRhJ10sXG4gICAgICAgICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjbG91ZHdhdGNoOm5hbWVzcGFjZSc6ICdDbG91ZFdhdGNoU3ludGhldGljcycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBjcmVhdGUgY2FuYXJ5IGV4ZWN1dGlvbiByb2xlXG4gICAgICAgIHRoaXMuY2FuYXJ5Um9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCBgYXBpLWNhbmFyeS1yb2xlYCwge1xuICAgICAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYScpLFxuICAgICAgICAgICAgaW5saW5lUG9saWNpZXM6IHtcbiAgICAgICAgICAgICAgICBDYW5hcnlJYW1Qb2xpY3k6IGNhbmFyeUlhbVBvbGljeURvY3VtZW50LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhlY3V0aW9uIHJvbGUgZm9yIHRoZSBhcGkgY2FuYXJ5JyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gY3JlYXRlIGNhbmFyeVxuICAgICAgICB0aGlzLmNhbmFyeSA9IG5ldyBzeW50aGV0aWNzLkNhbmFyeSh0aGlzLCBpZCwge1xuICAgICAgICAgICAgYXJ0aWZhY3RzQnVja2V0TG9jYXRpb246IHsgYnVja2V0OiBjYW5hcnlTM0J1Y2tldC5idWNrZXQgfSxcbiAgICAgICAgICAgIHJvbGU6IHRoaXMuY2FuYXJ5Um9sZSxcbiAgICAgICAgICAgIHJ1bnRpbWU6IHN5bnRoZXRpY3MuUnVudGltZS5TWU5USEVUSUNTX05PREVKU19QVVBQRVRFRVJfM18wLFxuICAgICAgICAgICAgdGVzdDogc3ludGhldGljcy5UZXN0LmN1c3RvbSh7XG4gICAgICAgICAgICAgICAgY29kZTogc3ludGhldGljcy5Db2RlLmZyb21JbmxpbmUoXG4gICAgICAgICAgICAgICAgICAgIGZpbGUucmVhZEZpbGVTeW5jKHByb3BzLmNhbmFyeVNvdXJjZVBhdGgpLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY2FuYXJ5TmFtZTogcHJvcHMuY2FuYXJ5TmFtZSA/PyBgJHtpZH0tY2FubmFyeWAsXG4gICAgICAgICAgICBzY2hlZHVsZTpcbiAgICAgICAgICAgICAgICBwcm9wcy5zY2hlZHVsZUZvckNhbmFyeSA/PyBzeW50aGV0aWNzLlNjaGVkdWxlLnJhdGUoRHVyYXRpb24ubWludXRlcyg1KSksXG4gICAgICAgICAgICBzdGFydEFmdGVyQ3JlYXRpb246IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5jYW5hcnkubm9kZS5kZWZhdWx0Q2hpbGQgYXMgc3ludGhldGljcy5DZm5DYW5hcnk7XG4gICAgICAgIGNoaWxkLmFkZFByb3BlcnR5T3ZlcnJpZGUoJ1J1bkNvbmZpZy5FbnZpcm9ubWVudFZhcmlhYmxlcycsIHtcbiAgICAgICAgICAgIFRFU1RfVEFSR0VUX0FQSTogcHJvcHMuYXBpVXJsLFxuICAgICAgICAgICAgLi4ucHJvcHMuZW52aXJvbm1lbnRWYXJpYWJsZSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19