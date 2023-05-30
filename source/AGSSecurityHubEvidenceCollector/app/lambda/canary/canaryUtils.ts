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
const logger = require('SyntheticsLogger');
const awsSigV4 = require('./awsSigV4');
const synthetics = require('Synthetics');

const config = {
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: process.env.AWS_REGION,
    service: 'execute-api',
};

const stepConfig = {
    includeRequestHeaders: true,
    includeResponseHeaders: true,
    restrictedHeaders: ['x-amz-security-token', 'Authorization'], // Restricted header values do not appear in report generated.
    includeRequestBody: true,
    includeResponseBody: true,
};

export function createRequest<T>(
    method: 'POST' | 'GET' | 'PUT',
    hostname: string,
    path: string,
    body?: T,
    headers?: Record<string, string>
): any {
    const request: Record<string, any> = {
        hostname,
        port: 443,
        protocols: 'https',
        headers: headers
            ? { ...headers, 'User-Agent': 'Chrome/85.0.4182.0', ttl: '5' }
            : { 'User-Agent': 'Chrome/85.0.4182.0', ttl: '5' },
        method,
        path,
    };

    if (body) {
        request.body = JSON.stringify(body);
    }

    awsSigV4.signRequest(request, config);

    return request;
}

export function callback<T>(res: any, statusCode: number): T | PromiseLike<T> {
    return new Promise((resolve) => {
        if (res.statusCode !== statusCode) {
            throw `Expected ${statusCode} but received ${res.statusCode}`;
        }

        let responseBody = '';
        res.on('data', (d: any) => {
            responseBody += d;
        });

        res.on('end', () => {
            logger.info(`Received response `, responseBody);
            resolve(JSON.parse(responseBody.toString()));
        });
    });
}

export function testApi(
    title: string,
    request: any,
    callback?: (res: any) => Promise<void>
): Promise<void> {
    return synthetics.executeHttpStep(title, request, callback, stepConfig);
}

export function log(message: string) {
    logger.info(message);
}
