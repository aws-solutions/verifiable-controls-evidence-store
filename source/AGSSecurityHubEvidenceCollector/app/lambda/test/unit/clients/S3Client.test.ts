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
import { storeFinding } from 'src/clients/S3Client';
import { putObjectResponse } from 'test/__mocks__/@aws-sdk/client-s3';
import { getParameterResponse } from 'test/__mocks__/@aws-sdk/client-ssm';

describe('S3 client tests', () => {
    beforeEach(() => {
        process.env.EVIDENCE_ATTACHMENT_BUCKET_PARAM = 'bucket';
        getParameterResponse.mockResolvedValueOnce({ Parameter: { Value: 'bucket' } });
    });

    test('can store s3 object', async () => {
        const finding = { findingId: 'this-id', source: 'this-source' };
        const s3Url = await storeFinding(finding, 'this-bucket', 'this-key');

        expect(putObjectResponse).toBeCalledTimes(1);
        expect(s3Url).not.toBeUndefined();
    });

    test('throws error if object is undefined', async () => {
        const task = () => storeFinding(undefined, 'this-bucket', 'this-key');

        await expect(task).rejects.toThrowError();
    });

    test('throws error if call to s3 client fails', async () => {
        putObjectResponse.mockReturnValueOnce(Promise.reject(true));
        const finding = { findingId: 'this-id', source: 'this-source' };
        const task = () => storeFinding(finding, 'this-bucket', 'this-key');

        await expect(task).rejects.toThrowError();
    });
});
