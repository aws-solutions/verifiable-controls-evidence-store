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
import { instance, mock, when } from 'ts-mockito';
import { EvidenceService } from 'src/services/EvidenceService';
import { GetEvidenceRevisionsHandler } from 'src/handlers/GetEvidenceRevisionsHandler';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { FullEvidenceOutputWithVersion } from 'src/types/EvidenceOutput';
import { QueryOutput } from 'src/types/QueryOutput';

describe('Get evidence revisions tests', () => {
    const service = mock(EvidenceService);
    const handler = new GetEvidenceRevisionsHandler(instance(service));
    const revisions = {
        results: [
            {
                evidenceId: '123',
                providerId: 'authority',
                createdTimestamp: new Date().toISOString(),
                schemaId: 'schema-123',
                targetId: 'target-123',
                version: 1,
                providerName: 'name',
            },
        ],
        total: 1,
    };

    test('returns bad request if no path parameters provided', async () => {
        // act
        const result = () => handler.handle({} as APIGatewayProxyEvent, {} as Context);

        // assert
        await expect(result()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('returns bad request if no evidence id  provided', async () => {
        // act
        const result = () =>
            handler.handle(
                { pathParameters: { test: '123' } } as unknown as APIGatewayProxyEvent,
                {} as Context
            );

        // assert
        await expect(result()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('can get evidence revisions', async () => {
        // arrange
        when(service.getEvidenceRevisions('123', undefined)).thenResolve(revisions);

        // act
        const result = await handler.handle(
            {
                pathParameters: { id: '123' },
            } as unknown as APIGatewayProxyEvent,
            {} as Context
        );

        // assert
        expect(result.statusCode).toBe(200);
        const output = <QueryOutput<FullEvidenceOutputWithVersion>>(
            JSON.parse(result.body)
        );
        expect(output.total).toBe(1);
        expect(output.results.length).toBe(1);
    });

    test('can get evidence revisions with next token', async () => {
        // arrange
        when(service.getEvidenceRevisions('123', 'my-next-token')).thenResolve(revisions);

        // act
        const result = await handler.handle(
            {
                pathParameters: { id: '123' },
                queryStringParameters: { nextToken: 'my-next-token' },
            } as unknown as APIGatewayProxyEvent,
            {} as Context
        );

        // assert
        expect(result.statusCode).toBe(200);
        const output = <QueryOutput<FullEvidenceOutputWithVersion>>(
            JSON.parse(result.body)
        );
        expect(output.total).toBe(1);
        expect(output.results.length).toBe(1);
    });
});
