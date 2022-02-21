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
import { ListProviderHandler } from 'src/handlers/ListProviderHandler';
import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { EvidenceProviderOutput } from 'src/types/EvidenceProviderOutput';
import { QueryOutput } from 'src/types/QueryOutput';
import { anything, instance, mock, when } from 'ts-mockito';

describe('List evidence provider handler tests', () => {
    const service = mock(EvidenceProviderService);
    const handler = new ListProviderHandler(instance(service));

    test('can list evidence providers', async () => {
        // arrange
        when(service.listEvidenceProviders(anything())).thenResolve({
            results: [
                {
                    providerId: '1234',
                    createdTimestamp: new Date().toISOString(),
                    enabled: true,
                    name: 'test-authority',
                    schemas: [{ schemaId: 'schema1' }, { schemaId: 'schema2' }],
                },
            ],
            nextToken: '1234',
        });

        // act
        const result = await handler.handle(
            { queryStringParameters: { limit: 10 } } as unknown as APIGatewayProxyEvent,
            {} as Context
        );

        // assert
        expect(result.statusCode).toBe(200);
        const body = <QueryOutput<EvidenceProviderOutput>>JSON.parse(result.body);
        expect(body.results.length).toBe(1);
        expect(body.nextToken).toBe('1234');
    });
});
