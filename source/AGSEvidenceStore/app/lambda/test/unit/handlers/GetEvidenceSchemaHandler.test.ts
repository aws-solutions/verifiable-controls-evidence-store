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
import { GetEvidenceSchemaHandler } from 'src/handlers/GetEvidenceSchemaHandler';
import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { anything, instance, mock, when } from 'ts-mockito';

describe('GetEvidenceSchemaHandler tests', () => {
    const service = mock(EvidenceProviderService);
    const handler = new GetEvidenceSchemaHandler(instance(service));

    test('returns 400 if no path params provided', async () => {
        const result = () => handler.handle({} as APIGatewayProxyEvent, {} as Context);

        await expect(result()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('returns 400 if no id or schemaId found in path params', async () => {
        const result = () =>
            handler.handle(
                {
                    pathParameters: { test: 'value', schemaId: '1234' },
                } as unknown as APIGatewayProxyEvent,
                {} as Context
            );

        await expect(result()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('returns 404 if schema not found', async () => {
        when(service.getEvidenceSchema(anything())).thenResolve(null);

        const result = await handler.handle(
            {
                pathParameters: { id: '123', schemaId: '123' },
            } as unknown as APIGatewayProxyEvent,
            {} as Context
        );

        expect(result.statusCode).toBe(404);
    });

    test('returns 200 with schema details', async () => {
        when(service.getEvidenceSchema(anything())).thenResolve({
            providerId: '123',
            schemaId: '123',
            content: {},
            createdTimestamp: new Date().toISOString(),
        });

        const result = await handler.handle(
            {
                pathParameters: { id: '123', schemaId: '123' },
            } as unknown as APIGatewayProxyEvent,
            {} as Context
        );

        expect(result.statusCode).toBe(200);
    });
});
