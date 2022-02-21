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
import * as s3 from '@aws-sdk/client-s3';
import { baseSdkClientConfig, createXRayEnabledClient } from '../common/SdkClient';
import { SSMParameterClient } from './SSMParameterClient';

const s3Client = createXRayEnabledClient(new s3.S3Client({ ...baseSdkClientConfig }));

export async function storeFinding(
    finding: any,
    findingId: string,
    findingSource: string
): Promise<string> {
    if (!finding) {
        const msg = `Error attempting to store undefined object with in s3 bucket`;
        console.error(msg);
        throw new Error(msg);
    }
    console.log(findingId + findingSource);

    const objectKey = `evidence-collector/${findingId}-${new Date().getTime()}.json`;
    const bucketName = await SSMParameterClient.getInstance().getStringParameterValue(
        process.env.EVIDENCE_ATTACHMENT_BUCKET_PARAM!
    );

    console.debug(
        `Uploading original finding as evidence attachment to S3 bucket ${bucketName} with object key ${objectKey}`
    );

    try {
        await s3Client.send(
            new s3.PutObjectCommand({
                Bucket: bucketName,
                Key: objectKey,
                Body: JSON.stringify(finding),
                ContentType: 'application/json',
            })
        );

        return objectKey;
    } catch (error) {
        console.error(error);
        throw new Error(
            `Error while attempting to put object with key ${objectKey} in s3 bucket ${bucketName}`
        );
    }
}
