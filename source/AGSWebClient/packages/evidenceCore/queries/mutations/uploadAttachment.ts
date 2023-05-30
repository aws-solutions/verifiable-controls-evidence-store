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
import { FileUploadParams } from '../../types';
import * as crypto from 'crypto';

export async function uploadAttachment(params: FileUploadParams): Promise<string> {
    console.log('in mutation', params);
    const s3Client = new aws.S3({
        credentials: params.userCredential,
        region: params.userCredential.region,
    });
    const ssm = new aws.SSM({
        credentials: params.userCredential,
        region: params.userCredential.region,
    });
    const ssmResult = await ssm
        .getParameter({
            Name: '/ags/evidence-store/attachment-bucket',
        })
        .promise();

    if (ssmResult.$response.error) {
        throw ssmResult.$response.error;
    }

    const bucketName = ssmResult.Parameter?.Value || '';
    if (!bucketName) {
        throw new Error('Cannot find attachment bucket name in SSM parameter.');
    }
    const objectKey = `${params.sessionId}/${params.file.name}`;

    const hash = await incrementalHash(params.file);

    const result = await s3Client
        .putObject({
            Bucket: bucketName,
            Key: objectKey,
            Body: params.file,
            ContentType: params.file.type,
            ChecksumSHA256: hash,
        })
        .promise();

    if (result.$response.error) {
        throw result.$response.error;
    }

    return objectKey;
}

function incrementalHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunkSize = 1024 * 1024 * 10; // read 10MB at a time
        let offset = 0;

        const hash = crypto.createHash('sha256');

        const readEventHandler = (event: ProgressEvent<FileReader>) => {
            if (event.target?.error === null || event.target?.error === undefined) {
                offset += (event.target!.result as ArrayBuffer).byteLength;
                // update the hash with what's in the stream
                hash.update(new Uint8Array(event.target!.result as ArrayBufferLike));
            } else {
                reject(event.target.error);
            }

            if (offset >= file.size) {
                // we've reached the end of the stream, compute the hash
                resolve(Buffer.from(hash.digest()).toString('base64'));
            }

            // read the next chunk
            readChunk(offset, chunkSize, file);
        };

        const readChunk = (startPosition: number, length: number, chunk: File): void => {
            const reader = new FileReader();
            const blob = chunk.slice(startPosition, length + startPosition);
            reader.onload = readEventHandler;
            reader.readAsArrayBuffer(blob);
        };

        // read the first chunk
        readChunk(offset, chunkSize, file);
    });
}
