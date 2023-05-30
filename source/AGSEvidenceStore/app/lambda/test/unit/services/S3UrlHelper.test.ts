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

import {
    constructObjectUrl,
    generateSignedUrl,
    parseObjectUrl,
} from 'src/services/S3UrlHelper';

import AGSError from 'src/common/AGSError';

jest.useFakeTimers();

describe('S3UrlHelper tests', () => {
    const s3 = new aws.S3({ region: 'ap-southeast-2' });

    test('can construct object url', () => {
        // act
        const url = constructObjectUrl(
            s3,
            'DOC-EXAMPLE-BUCKET',
            'my-object-key/level1/level2/filename'
        );

        // assert
        expect(url).toBe(
            'https://DOC-EXAMPLE-BUCKET.s3.ap-southeast-2.amazonaws.com/my-object-key/level1/level2/filename'
        );
    });

    test('can parse s3 object url', () => {
        // act
        const [bucketname, objectKey] = parseObjectUrl(
            'https://DOC-EXAMPLE-BUCKET.s3.amazonaws.com/my-object-key/level1/level2/filename'
        );

        // assert
        expect(bucketname).toBe('doc-example-bucket');
        expect(objectKey).toBe('my-object-key/level1/level2/filename');
    });

    test('throw error if invalid url', () => {
        // act
        const task = () => parseObjectUrl('123');

        expect(task).toThrow(AGSError);
    });

    test('can generate pre-signed url', () => {
        const url = generateSignedUrl('test', 'test');

        expect(url).toBeDefined();
    });
});
