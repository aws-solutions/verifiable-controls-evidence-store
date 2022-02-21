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
import * as iam from 'aws-cdk-lib/aws-iam';
import * as synthetics from '@aws-cdk/aws-synthetics-alpha';
import * as cdk from 'aws-cdk-lib';
import * as file from 'fs';
import { AgsSecureBucket } from './ags-secure-bucket';
import { Construct } from 'constructs';

export interface AGSCanaryProps {
    /**
     * URL of the target api for testing script.
     */
    readonly apiUrl: string;
    /**
     * path to canary source
     */
    readonly canarySourcePath: string;
    /**
     * optional - canary name, if not present will use id + canary instead
     */
    readonly canaryName?: string;
    /**
     * optional - schedule canary, unit Schedule {@link https://awscdk.io/packages/@aws-cdk/aws-synthetics@1.93.0/#/./@aws-cdk_aws-synthetics.Schedule }
     * Default value - 5 mins
     */
    readonly scheduleForCanary?: synthetics.Schedule;
    /**
     * optional - additional environment variables passing into canary
     * Default value - n/a
     */
    readonly environmentVariable?: Record<string, string>;
}
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

export class AGSApiCanary extends Construct {
    public readonly canary: synthetics.Canary;
    public readonly canaryRole: iam.Role;

    constructor(scope: Construct, id: string, props: AGSCanaryProps) {
        super(scope, id);

        // create s3 bucket for canary log output
        const canaryS3Bucket = new AgsSecureBucket(this, `api-canary-logs`, {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // create policy statement
        const canaryIamPolicyDocument = new iam.PolicyDocument();
        canaryIamPolicyDocument.addStatements(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:GetBucketLocation'],
                resources: [`${canaryS3Bucket.bucket.bucketArn}`],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:PutObject'],
                resources: [`${canaryS3Bucket.bucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:CreateLogGroup',
                ],
                resources: ['*'],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:ListAllMyBuckets'],
                resources: ['*'],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['cloudwatch:PutMetricData'],
                conditions: {
                    StringEquals: {
                        'cloudwatch:namespace': 'CloudWatchSynthetics',
                    },
                },
                resources: ['*'],
            })
        );

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
                code: synthetics.Code.fromInline(
                    file.readFileSync(props.canarySourcePath).toString()
                ),
                handler: 'index.handler',
            }),
            canaryName: props.canaryName ?? `${id}-cannary`,
            schedule:
                props.scheduleForCanary ?? synthetics.Schedule.rate(cdk.Duration.minutes(5)),
            startAfterCreation: true,
            environmentVariables:{
                TEST_TARGET_API: props.apiUrl,
                ...props.environmentVariable,
            }
        });
    }
}
