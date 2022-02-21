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
import { createHttpClient, HttpMethod } from '@apjsb-serverless-lib/apjsb-aws-httpclient';
import { HeaderBag } from '@aws-sdk/types';

export interface RestResponse<T> {
    statusCode: number;
    data?: T;
}

export function get<T>(uri: string): Promise<RestResponse<T>> {
    return sendRequest(uri, 'GET');
}

export function post<TResponse>(
    uri: string,
    body: any,
    headers?: HeaderBag
): Promise<RestResponse<TResponse>> {
    return sendRequest(uri, 'POST', body, headers);
}

export function put<TResponse>(uri: string, body: any): Promise<RestResponse<TResponse>> {
    return sendRequest(uri, 'PUT', body);
}

const client = createHttpClient(process.env.AWS_REGION ?? 'ap-southeast-2', true);

async function sendRequest<T>(
    uri: string,
    method: HttpMethod,
    body?: any,
    headers?: HeaderBag
): Promise<RestResponse<T>> {
    const response = await client.request(
        method,
        uri,
        'execute-api',
        body ? JSON.stringify(body) : undefined,
        headers
    );

    console.debug(`${uri} - response: `, response);

    const responseBody = response.body
        ? <T>JSON.parse(response.body.toString())
        : undefined;

    return {
        statusCode: response.statusCode,
        data: responseBody,
    };
}
