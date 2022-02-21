import { AGSSharedInfraClient } from '@ags-cdk/ags-service-template';
import { Metric, MetricOptions } from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as synthetics from '@aws-cdk/aws-synthetics-alpha';
import * as cdk from 'aws-cdk-lib';
import * as cfnSynthetics from 'aws-cdk-lib/aws-synthetics';
import { Construct } from 'constructs';
export interface AGSSyntheticsCanaryProps {
    /**
     * Name of the canary, must match ^[0-9a-z_\-]+$
     *
     * @required
     */
    readonly canaryName: string;
    /**
     * Specify the runtime version to use for the canary.
     *
     * @required
     */
    readonly runtime: synthetics.Runtime;
    /**
     * The type of test that you want your canary to run.
     *
     * Use `Test.custom()` to specify the test to run.
     *
     * @required
     */
    readonly test: synthetics.Test;
    /**
     * Specify the schedule for how often the canary runs.
     *
     * @optional
     * @default Once every 5 minutes (rate(5 minutes))
     */
    readonly schedule?: synthetics.Schedule;
    /**
     * Whether or not the canary should start after creation.
     *
     * @optional
     * @default true
     */
    readonly startAfterCreation?: boolean;
    /**
     * Environment variables to be passed into canary test script
     *
     * @optional
     */
    readonly environmentVariables?: Record<string, string>;
    /**
     * Canary test timeout in seconds
     *
     * @optional
     * @default 15 seconds
     */
    readonly timeoutInSeconds?: number;
    /**
     * AGS Shared Infra Client instance
     *
     * @optional
     */
    readonly sharedInfraClient?: AGSSharedInfraClient;
    /**
     * VPC configuration if canary will run inside the VPC
     *
     * If both sharedInfraClient and vpcConfig specified, vpcConfig will override the vpc setting in shared infra client.
     *
     * @optional
     * @default Canary will run without VPC
     */
    readonly vpcConfig?: cfnSynthetics.CfnCanary.VPCConfigProperty;
    /**
     * The S3 bucket prefix
     *
     * @optional - Specify this if you want a more specific path within the artifacts bucket.
     * @default No prefix
     */
    readonly s3BucketPrefix?: string;
    /**
     * Specify the ARN of the SNS Topic that the failed canary test alert to be sent to
     *
     * @optional
     * @default None - no alert to be sent to SNS topic
     */
    readonly alertSNSTopicArn?: string;
    /**
     * Specify if the artifact bucket should be removed when canary is destroyed
     *
     * Available option is in cdk.RemovalPolicy
     *
     * @optional
     * @default cdk.RemovalPolicy.DESTROY
     */
    readonly removalPolicy?: cdk.RemovalPolicy;
    /**
     * The canary's bucket encryption key arn
     *
     * @optional - If a key arn is specified, the corresponding KMS key will be used to encrypt canary S3 bucket.
     * @default None - A new key is provisioned for the canary S3 bucket.
     */
    readonly s3BucketEncryptionKeyArn?: string;
    /** The canary log bucket
     *
     * @optional - All canary logs will be stored in the provided bucket.
     * @default None - A new bucket is provisioned for the canary.
     */
    readonly canaryLogBucket?: s3.IBucket;
    /** The number of days to retain data about failed runs of this canary
     *
     * @optional
     * @default None - If none of provided, cdk automatically applies the default value of 31 days.
     */
    readonly failureLogRetentionPeriod?: number;
    /** The number of days to retain data about successful runs of this canary
     *
     * @optional
     * @default None - If none of provided, cdk automatically applies the default value of 31 days.
     */
    readonly successLogRetentionPeriod?: number;
}
export declare class AGSSyntheticsCanary extends Construct {
    readonly canaryRole: iam.Role;
    private readonly canaryName;
    constructor(scope: Construct, id: string, props: AGSSyntheticsCanaryProps);
    private createCode;
    private getCanaryRolePolicyDoc;
    /**
     * Measure the number of failed canary runs over a given time period.
     *
     * Default: sum over 5 minutes
     *
     * @param options - configuration options for the metric
     */
    metricFailed(options?: MetricOptions): Metric;
}
