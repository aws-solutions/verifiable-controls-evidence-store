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
import { anything, instance, mock, reset, when } from 'ts-mockito';

import { EvidenceProviderOutput } from 'src/types/EvidenceProviderOutput';
import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { UpdateProviderHandler } from 'src/handlers/UpdateProviderHandler';
import { UpdateProviderInputValidator } from 'src/validators/UpdateProviderInputValidator';

describe('Update evidence provider handler tests', () => {
    const service = mock(EvidenceProviderService);
    const validator = mock(UpdateProviderInputValidator);
    const handler = new UpdateProviderHandler(instance(service), instance(validator));

    const context = {} as Context;

    beforeEach(() => {
        reset();
        jest.clearAllMocks();
    });

    test('return 400 if no path parameters provided', async () => {
        // act
        const result = () =>
            handler.handle(
                {
                    httpMethod: 'PUT',
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

    test('return 400 if no authority id is provided', async () => {
        // act
        const result = () =>
            handler.handle(
                {
                    httpMethod: 'PUT',
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

    test("return 400 if body and path parameter don't match", async () => {
        // arrange
        when(validator.parseAndValidate(anything())).thenReturn({
            providerId: '123',
            enabled: false,
        });

        // act
        const result = await handler.handle(
            {
                httpMethod: 'PUT',
                pathParameters: { id: '1234' },
                body: JSON.stringify({ providerId: '12345', enabled: false }),
            } as unknown as APIGatewayProxyEvent,
            context
        );

        // assert
        expect(result.statusCode).toBe(400);
    });

    test('can update authority', async () => {
        // arrange
        when(validator.parseAndValidate(anything())).thenReturn({
            providerId: '1234',
            enabled: false,
        });
        when(service.toggleProviderStatus('1234', false)).thenResolve({
            providerId: '1234',
            name: 'test',
            enabled: false,
            createdTimestamp: new Date().toISOString(),
        });

        // act
        const result = await handler.handle(
            {
                httpMethod: 'PUT',
                pathParameters: { id: '1234' },
                body: JSON.stringify({ providerId: '1234', enabled: false }),
            } as unknown as APIGatewayProxyEvent,
            context
        );

        // assert
        expect(result.statusCode).toBe(200);
        const authority = JSON.parse(result.body) as EvidenceProviderOutput;
        expect(authority.enabled).toBe(false);
    });
});
