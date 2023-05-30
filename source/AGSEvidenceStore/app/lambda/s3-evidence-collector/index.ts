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
import * as lambda from 'aws-lambda';
import * as s3 from '@aws-sdk/client-s3';
import * as secrets from '@aws-sdk/client-secrets-manager';

import { S3EventRecord } from 'aws-lambda';

const apigClientFactory = require('aws-api-gateway-client').default;

const s3Client = new s3.S3Client({});
const secretsManager = new secrets.SecretsManagerClient({});

const targetBucketName = process.env.ATTACHMENT_BUCKET_NAME;
const evidenceStoreApi = process.env.EVIDENCE_STORE_API;
const region = process.env.AWS_REGION ?? 'ap-southeast-2';
const secretId = process.env.SECRET_ID;
const providerId = process.env.EVIDENCE_PROVIDER_ID;

let apiKey: string | undefined = undefined;

export async function handler(
    event: lambda.S3Event,
    _context: lambda.Context
): Promise<void> {
    console.debug(`Processing event ${JSON.stringify(event)}`);
    const putObjectEvents = event.Records.filter(
        (x) =>
            x.eventName === 'ObjectCreated:Put' ||
            x.eventName === 'ObjectCreated:CompleteMultipartUpload'
    );

    if (putObjectEvents.length === 0) {
        console.info('Event does not contain any put objects sub-events, doing nothing');
        return;
    }

    console.info(
        `Event contains ${putObjectEvents.length} put objects sub-events, processing copy objects`
    );

    if (!apiKey) {
        console.debug(`Retrieving api key from secrets manager`);
        const result = await secretsManager.send(
            new secrets.GetSecretValueCommand({ SecretId: secretId })
        );

        apiKey = result.SecretString;
    }

    await Promise.all(
        putObjectEvents.map(async (x) => {
            try {
                // copy object to evidence store attachment bucket
                x.s3.object.size > 1024 * 1024 * 100
                    ? await multipartCopy(x) // object larger than 100MB, do multipart
                    : await singlepartCopy(x);

                console.debug(
                    `Successfully copied ${x.s3.bucket.name}/${x.s3.object.key} to ${targetBucketName}`
                );

                // create evidence with copied object as attachment
                const apiClient = apigClientFactory.newClient({
                    invokeUrl: evidenceStoreApi,
                    apiKey,
                    region: region,
                    accessKey: process.env.AWS_ACCESS_KEY_ID,
                    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
                    sessionToken: process.env.AWS_SESSION_TOKEN,
                });

                // get object tags
                console.debug(
                    `Fetching object tags for ${x.s3.bucket.name}/${x.s3.object.key}`
                );
                const tags = await s3Client.send(
                    new s3.GetObjectTaggingCommand({
                        Bucket: x.s3.bucket.name,
                        Key: x.s3.object.key,
                    })
                );

                const objectTags: Record<string, string | undefined> = {};
                tags.TagSet?.forEach((x) => {
                    if (x.Key) {
                        objectTags[x.Key] = x.Value;
                    }
                });

                const response = await apiClient.invokeApi(
                    {},
                    'evidences',
                    'POST',
                    {},
                    {
                        providerId,
                        targetId: x.s3.object.key,
                        schemaId: 's3-evidence-schema',
                        content: {
                            originalBucketName: x.s3.bucket.name,
                            originalObjectKey: x.s3.object.key,
                            uploadPrincipalId: x.userIdentity.principalId,
                            objectSize: x.s3.object.size,
                            objectTags,
                        },
                        attachments: [{ objectKey: x.s3.object.key }],
                    }
                );

                console.debug(`Create evidence response status code ${response.status}`);
            } catch (error) {
                console.error(
                    `Failed to copy ${x.s3.bucket.name}/${
                        x.s3.object.key
                    } to ${targetBucketName} - error ${JSON.stringify(error)}`
                );

                throw error;
            }
        })
    );
}

async function multipartCopy(record: S3EventRecord): Promise<string> {
    const partSize = 100 * 1204 * 1024;
    let bytePosition = 0;
    let partNumber = 1;
    const objectSize = record.s3.object.size;

    const multiPartUpload = await s3Client.send(
        new s3.CreateMultipartUploadCommand({
            Bucket: targetBucketName,
            Key: record.s3.object.key,
            ChecksumAlgorithm: 'SHA256',
        })
    );
    const uploadId = multiPartUpload.UploadId;

    const uploadPartCopyCommands: s3.UploadPartCopyCommand[] = [];

    while (bytePosition < objectSize) {
        const lastByte = Math.min(bytePosition + partSize - 1, objectSize - 1);

        uploadPartCopyCommands.push(
            new s3.UploadPartCopyCommand({
                UploadId: uploadId,
                Bucket: targetBucketName,
                Key: record.s3.object.key,
                PartNumber: partNumber,
                CopySource: encodeURI(
                    `/${record.s3.bucket.name}/${record.s3.object.key}`
                ),
                CopySourceRange: `bytes=${bytePosition}-${lastByte}`,
            })
        );
        bytePosition += partSize;
        partNumber = partNumber + 1;
    }

    console.debug(
        `Copying ${uploadPartCopyCommands.length} parts from ${record.s3.bucket.name}/${record.s3.object.key} to ${targetBucketName}`
    );

    const uploadPartCopyResults = await Promise.all(
        uploadPartCopyCommands.map(async (x) => {
            const result = await s3Client.send(x);

            console.debug(`Successfully copied part ${x.input.PartNumber}`);

            return result;
        })
    );

    const multiPartUploadResults = uploadPartCopyResults.map((part, index) => {
        return {
            ETag: part.CopyPartResult?.ETag,
            PartNumber: index + 1,
            ChecksumSHA256: part.CopyPartResult?.ChecksumSHA256,
        };
    });

    console.debug(`Completing multi part copy`);

    const finalResult = await s3Client.send(
        new s3.CompleteMultipartUploadCommand({
            Bucket: targetBucketName,
            Key: record.s3.object.key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: multiPartUploadResults,
            },
        })
    );

    return finalResult.ChecksumSHA256!;
}

async function singlepartCopy(record: S3EventRecord): Promise<string> {
    const result = await s3Client.send(
        new s3.CopyObjectCommand({
            Bucket: targetBucketName,
            Key: record.s3.object.key,
            ChecksumAlgorithm: 'SHA256',
            CopySource: encodeURI(`/${record.s3.bucket.name}/${record.s3.object.key}`),
        })
    );

    return result.CopyObjectResult!.ChecksumSHA256!;
}
