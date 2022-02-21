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
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import 'reflect-metadata';
import { CreateEvidenceSchemaHandler } from 'src/handlers/CreateEvidenceSchemaHandler';
import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { CreateEvidenceSchemaInputValidator } from 'src/validators/CreateEvidenceSchemaInputValidator';
import { anything, instance, mock, when } from 'ts-mockito';

describe('CreateEvidenceSchemaRequestHandler tests', () => {
    const service = mock(EvidenceProviderService);
    const validator = mock(CreateEvidenceSchemaInputValidator);
    const handler = new CreateEvidenceSchemaHandler(
        instance(service),
        instance(validator)
    );
    const input = {
        providerId: '123',
        schemaId: '123',
        content: {},
    };

    test('returns 400 if request has no path param', async () => {
        // act
        const response = () => handler.handle({} as APIGatewayProxyEvent, {} as Context);

        // assert
        await expect(response()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('returns 400 if request has no id path param', async () => {
        // act
        const response = () =>
            handler.handle(
                {
                    pathParameters: { test: 'value' },
                } as unknown as APIGatewayProxyEvent,
                {} as Context
            );

        // assert
        await expect(response()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('returns 400 if id path parm does not match providerId in body', async () => {
        // arrange
        when(validator.parseAndValidate(anything())).thenReturn(input);

        // act
        const response = await handler.handle(
            {
                pathParameters: { id: 'value' },
            } as unknown as APIGatewayProxyEvent,
            {} as Context
        );

        // assert
        expect(response.statusCode).toBe(400);
    });

    test('returns 201 response for valid requests', async () => {
        // assert
        when(validator.parseAndValidate(anything())).thenReturn(input);

        // act
        const response = await handler.handle(
            {
                body: input,
                pathParameters: { id: '123' },
                headers: { ttl: new Date().getTime().toString() },
            } as unknown as APIGatewayProxyEvent,
            {} as Context
        );

        // assert
        expect(response.statusCode).toBe(201);
    });
});
