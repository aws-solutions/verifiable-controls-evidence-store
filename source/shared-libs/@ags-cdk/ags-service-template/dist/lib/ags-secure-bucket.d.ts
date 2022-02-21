import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as kms from '@aws-cdk/aws-kms';
export declare type AgsSecureBucketProps = Omit<s3.BucketProps, 'encryptionKey' | 'encryption' | 'blockPublicAccess' | 'accessControl' | 'versioned' | 'serverAccessLogsPrefix'> & {
    encryptionKeyArn?: string;
};
export declare class AgsSecureBucket extends cdk.Construct {
    readonly bucket: s3.Bucket;
    readonly encryptionKey: kms.IKey;
    constructor(scope: cdk.Construct, id: string, props: AgsSecureBucketProps);
}
