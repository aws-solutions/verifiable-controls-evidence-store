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
import 'reflect-metadata';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { instance, mock, reset, when } from 'ts-mockito';

import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { GetProviderHandler } from 'src/handlers/GetProviderHandler';
import { EvidenceProviderOutput } from 'src/types/EvidenceProviderOutput';

describe('Get evidence authority by id handler tests', () => {
    const service: EvidenceProviderService = mock(EvidenceProviderService);
    const handler = new GetProviderHandler(instance(service));

    const event = {
        httpMethod: 'GET',
        pathParameters: {
            id: '1234',
        },
    } as unknown as APIGatewayProxyEvent;
    const context = {} as Context;
    beforeEach(() => reset());
    test('should return evidence authority', async () => {
        // arrange
        when(service.getEvidenceProviderById('1234')).thenResolve({
            providerId: '1234',
            createdTimestamp: new Date().toISOString(),
            enabled: true,
            name: 'authority name',
        });

        // act
        const result = await handler.handle(event, context);

        // assert
        expect(result.statusCode).toBe(200);
        const provider = <EvidenceProviderOutput>JSON.parse(result.body);
        expect(provider.providerId).toBe('1234');
        expect(provider.name).toBe('authority name');
    });

    test('should return 400 if no path parameters provided', async () => {
        // act
        const result = () =>
            handler.handle(
                {
                    httpMethod: 'GET',
                    pathParameters: undefined,
                } as unknown as APIGatewayProxyEvent,
                context
            );

        // assert
        await expect(result()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('should return 400 if no authority id is provided', async () => {
        // act
        const result = () =>
            handler.handle(
                {
                    httpMethod: 'GET',
                    pathParameters: { key: 'value' },
                } as unknown as APIGatewayProxyEvent,
                context
            );

        // assert
        await expect(result()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('should return 404 if authority not found', async () => {
        // arrange
        when(service.getEvidenceProviderById('1234')).thenResolve(undefined);

        // act
        const result = await handler.handle(event, context);

        // assert
        expect(result.statusCode).toBe(404);
    });
});
