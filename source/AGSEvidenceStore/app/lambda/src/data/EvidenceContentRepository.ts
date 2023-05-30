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
import * as aws from 'aws-sdk';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import { base64ToBase64Url, computeHash } from 'src/services/CryptoHelper';
import { constructObjectUrl } from 'src/services/S3UrlHelper';
import { inject, injectable } from 'tsyringe';
import { EvidenceContentData } from './schemas/EvidenceContentData';
import AGSError from 'src/common/AGSError';

@injectable()
export class EvidenceContentRepository {
    private readonly bucketName: string;

    constructor(
        @inject('S3') private s3: aws.S3,
        @inject('AppConfiguration') appConfig: AppConfiguration
    ) {
        this.bucketName = appConfig.evidenceContentBucketName;
    }

    async putContent(content: EvidenceContentData): Promise<string> {
        const request: aws.S3.PutObjectRequest = {
            Bucket: this.bucketName,
            Key: this.computeObjectKey(content),
            Body: content.content,
        };

        await this.s3.putObject(request).promise();

        return constructObjectUrl(
            this.s3,
            this.bucketName,
            this.computeObjectKey(content)
        );
    }

    async getEvidenceContent(
        bucketName: string,
        objectKey: string
    ): Promise<string | null> {
        const content = await this.s3
            .getObject({ Bucket: bucketName, Key: objectKey })
            .promise();

        return content.Body?.toString() ?? null;
    }

    async deleteContent(content: EvidenceContentData): Promise<void> {
        const request: aws.S3.DeleteObjectRequest = {
            Bucket: this.bucketName,
            Key: this.computeObjectKey(content),
        };
        await this.s3.deleteObject(request).promise();
    }

    async getObjectAttributes(
        bucketName: string,
        objectKey: string
    ): Promise<{ objectHash: string; objectSize?: number } | undefined> {
        let objectSize = 0;
        //try {
        // get object attributes
        const attributes = await this.s3
            .getObjectAttributes({
                Bucket: bucketName,
                Key: objectKey,
                ObjectAttributes: ['Checksum', 'ObjectSize'],
            })
            .promise();

        if (attributes.Checksum && attributes.Checksum.ChecksumSHA256) {
            return {
                objectHash: base64ToBase64Url(attributes.Checksum.ChecksumSHA256),
                objectSize: attributes.ObjectSize,
            };
        }

        objectSize = attributes.ObjectSize ?? 0;

        if (objectSize === 0 || objectSize > 104857600) {
            // default 100MB
            throw new AGSError(
                `object ${bucketName}/${objectKey} is larger than the allowed 100MB`,
                400
            );
        }

        const attachmentContent = await this.getEvidenceContent(bucketName, objectKey);

        if (!attachmentContent) {
            throw new AGSError(
                `Unable to download attachment with objectKey ${objectKey}, the object appears to be empty`,
                400
            );
        }

        return {
            objectHash: computeHash(attachmentContent, 'base64url'),
            objectSize: objectSize,
        };
    }

    generateSignedUrl(bucketName: string, objectKey: string): string {
        return this.s3.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: objectKey,
            Expires: 300, // 5 minutes
        });
    }

    private computeObjectKey(content: EvidenceContentData) {
        return `${content.evidenceProviderId}/${computeHash(
            content.targetId,
            'base64url'
        )}/${content.contentHash}`;
    }
}
