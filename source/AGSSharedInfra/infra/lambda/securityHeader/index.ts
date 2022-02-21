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
import cheerio from 'cheerio';
import { nanoid } from 'nanoid';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const region = process.env.AWS_REGION;
const bucket = process.env.BUCKET_NAME || '';
const objectKey = process.env.OBJECT_KEY || '';

const streamToString = (stream: Readable): Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });

const handler = async () => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
    });

    const client = new S3Client({ region });

    try {
        const response = await client.send(command);
        const content = await streamToString(response.Body);

        const $ = cheerio.load(content);
        const nonce = nanoid();
        $('script').attr('nonce', nonce);
        $('style').attr('nonce', nonce);

        $('meta[property="csp-nonce"]').attr('content', nonce);

        const html = $.html();

        return {
            statusCode: 200,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Content-Security-Policy': `default-src 'none'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; font-src 'self'; img-src 'self' data: *.amazonaws.com *.amazon.com *.amazoncognito.com; form-action 'self'; base-uri 'self'; frame-ancestors 'self'; manifest-src 'self'; connect-src 'self' *.amazonaws.com *.amazon.com *.amazoncognito.com; object-src 'none'; frame-src 'none'`,
                'Content-Type': 'text/html; charset=utf-8',
                Expires: '0',
                Pragma: 'no-cache',
                'Strict-Transport-Security':
                    'max-age=31536001; includeSubDomains; preload',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'same-origin',
            },
            body: html,
        };
    } catch (e) {
        console.log('Error: ', e);
        return {
            statusCode: 404,
        };
    }
};

export { handler };
