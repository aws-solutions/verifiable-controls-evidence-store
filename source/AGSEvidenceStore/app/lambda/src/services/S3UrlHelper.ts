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
import * as url from 'whatwg-url';

import AGSError from 'src/common/AGSError';

export function constructObjectUrl(
    s3Client: aws.S3,
    bucketName: string,
    objectKey: string
): string {
    return `${s3Client.endpoint.protocol}//${bucketName}.${s3Client.endpoint.hostname}/${objectKey}`;
}

export function parseObjectUrl(objectUrl: string): [string, string] {
    const parsedUrl = url.parseURL(objectUrl);

    if (!parsedUrl) {
        throw new AGSError(`Invalid object url ${objectUrl}`, 422);
    }

    const bucketName = (parsedUrl.host as string).split('.')[0];
    const objectKey = parsedUrl.path.join('/');

    return [bucketName, objectKey];
}

export function generateSignedUrl(bucketName: string, objectKey: string): string {
    if (!bucketName || !objectKey) {
        return '';
    }
    return new aws.S3({ signatureVersion: 'v4' }).getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: objectKey,
        Expires: 300, // 5 minutes
    });
}
