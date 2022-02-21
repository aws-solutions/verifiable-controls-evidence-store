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
import { APIGatewayProxyEvent } from 'aws-lambda';
import AGSError from 'src/common/AGSError';

export function readOptionalPathParameter(
    event: APIGatewayProxyEvent,
    paramName: string
): string | undefined {
    return event?.pathParameters?.[paramName];
}

export function readMandatoryPathParameter(
    event: APIGatewayProxyEvent,
    paramName: string
): string {
    const paramValue = readOptionalPathParameter(event, paramName);

    if (!paramValue)
        throw new AGSError(
            `${paramName} path parameter is required and cannot be null or empty.`,
            400
        );

    return paramValue;
}

export function readQueryStringValue(
    event: APIGatewayProxyEvent,
    queryStringName: string
): string | undefined {
    return event?.queryStringParameters?.[queryStringName];
}
