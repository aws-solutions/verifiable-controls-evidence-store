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
import * as securityHeader from '.';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const ORIGINAL_INDEX =
    '<html><head><meta property="csp-nonce" content="nonceId" /><title>AWS Governance Suite</title></head><body><script>alert(\'this is inline script\');</script></body></html>';

const UPDATED_INDEX =
    '<html><head><meta property="csp-nonce" content="randomId"><title>AWS Governance Suite</title></head><body><script nonce="randomId">alert(\'this is inline script\');</script></body></html>';

jest.mock('nanoid', () => ({
    nanoid: jest.fn().mockReturnValue('randomId'),
}));

const s3Mock = mockClient(S3Client);

describe('securityHeader', () => {
    beforeEach(() => {
        s3Mock.reset();
    });

    test('adds nonce value to script/style tags and returns security headers', async () => {
        s3Mock.on(GetObjectCommand).resolves({
            Body: Readable.from([Buffer.from(ORIGINAL_INDEX)]),
        });
        const output = await securityHeader.handler();

        expect(output.statusCode).toBe(200);
        expect(output.headers).toEqual({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Security-Policy':
                "default-src 'none'; script-src 'self' 'nonce-randomId'; style-src 'self' 'nonce-randomId'; font-src 'self'; img-src 'self' data: *.amazonaws.com *.amazon.com *.amazoncognito.com; form-action 'self'; base-uri 'self'; frame-ancestors 'self'; manifest-src 'self'; connect-src 'self' *.amazonaws.com *.amazon.com *.amazoncognito.com; object-src 'none'; frame-src 'none'",
            'Content-Type': 'text/html; charset=utf-8',
            Expires: '0',
            Pragma: 'no-cache',
            'Referrer-Policy': 'same-origin',
            'Strict-Transport-Security': 'max-age=31536001; includeSubDomains; preload',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
        });
        expect(output.body).toBe(UPDATED_INDEX);
    });

    test('returns 404 when error occurs', async () => {
        s3Mock.on(GetObjectCommand).rejects(new Error('Error'));
        const output = await securityHeader.handler();

        expect(output.statusCode).toBe(404);
    });
});
