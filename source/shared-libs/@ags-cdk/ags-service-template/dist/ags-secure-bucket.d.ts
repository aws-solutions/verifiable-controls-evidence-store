import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
export declare type AgsSecureBucketProps = Omit<s3.BucketProps, 'encryptionKey' | 'encryption' | 'blockPublicAccess' | 'accessControl' | 'versioned' | 'serverAccessLogsPrefix'> & {
    encryptionKeyArn?: string;
};
export declare class AgsSecureBucket extends Construct {
    readonly bucket: s3.Bucket;
    readonly encryptionKey: kms.IKey;
    constructor(scope: Construct, id: string, props: AgsSecureBucketProps);
}
