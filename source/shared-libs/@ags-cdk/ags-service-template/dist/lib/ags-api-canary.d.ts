import * as iam from '@aws-cdk/aws-iam';
import * as synthetics from '@aws-cdk/aws-synthetics';
import * as cdk from '@aws-cdk/core';
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
export declare class AGSApiCanary extends cdk.Construct {
    readonly canary: synthetics.Canary;
    readonly canaryRole: iam.Role;
    constructor(scope: cdk.Construct, id: string, props: AGSCanaryProps);
}
