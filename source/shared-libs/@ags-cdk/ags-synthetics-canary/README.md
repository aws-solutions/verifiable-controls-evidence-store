# `@ags-cdk/ags-synthetics-canary`

## Overview

This construct is an enhanced version of `@aws-cdk/aws-synthetics/Canary` CDK construct and provides support for VPC and works with `AGSSharedInfraClient`.

## Usage

```
new AgsSyntheticsCanary(this, 'Canary', {
    canaryName: 'test-canary',
    runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_0,
    test: synthetics.Test.custom({
        code: synthetics.Code.fromInline('Code here'),
        handler: 'index.handler',
    }),
    schedule: synthetics.Schedule.rate(cdk.Duration.minutes(10)),
    startAfterCreation: false,
    environmentVariables: {
        Env1: 'Value1',
        Env2: 'Value2',
    },
    timeoutInSeconds: 30,
    sharedInfraClient,
    vpcConfig,
    s3BucketPrefix: "ServiceName"
    alertSNSTopicArn: "arn:aws:xxxxxxx"
    removalPolicy: cdk.RemovalPolicy.DESTROY
});

```
