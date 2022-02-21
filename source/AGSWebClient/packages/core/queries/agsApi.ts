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
import { ApiEndpoints, UserCredential } from '../types';
const clientFactory = require('aws-api-gateway-client').default;

export interface AgsApiOptions<T = {}> {
    endpoints?: ApiEndpoints;
    credential?: UserCredential;
    serviceName: string;
    pathTemplate: string;
    pathParameters?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    queryParams?: Record<string, unknown>;
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    payload?: Omit<T, 'id' | 'entityType' | 'entityId'>;
}

export async function invokeAgsApi<TRequest, TResponse>(
    options: AgsApiOptions<TRequest>
): Promise<TResponse> {
    if (!options.endpoints || !options.endpoints[options.serviceName]) {
        throw Error(`Could not find endpoint for service name ${options.serviceName}`);
    }

    if (!options.credential) {
        throw Error('Credentials must not be undefined');
    }

    const client = clientFactory.newClient({
        invokeUrl: options.endpoints[options.serviceName],
        region: options.credential.region,
        accessKey: options.credential.accessKeyId,
        secretKey: options.credential.secretAccessKey,
        sessionToken: options.credential.sessionToken,
    });

    const additionalParameters = {
        headers: options.headers,
        queryParams: options.queryParams,
    };

    const response = await client.invokeApi(
        options.pathParameters,
        options.pathTemplate,
        options.method,
        additionalParameters,
        options.payload ? options.payload : undefined
    );

    return response.data as TResponse;
}
