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
import { anything, instance, mock, when } from 'ts-mockito';

import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { CreateEvidenceProviderInput } from 'src/types/CreateEvidenceProviderInput';
import { CreateProviderHandler } from 'src/handlers/CreateProviderHandler';
import { EvidenceProviderOutput } from 'src/types/EvidenceProviderOutput';
import { CreateProviderInputValidator } from 'src/validators/CreateProviderInputValidator';

describe('Create evidence provider handler tests', () => {
    const service: EvidenceProviderService = mock(EvidenceProviderService);
    const validator: CreateProviderInputValidator = mock(CreateProviderInputValidator);
    const handler = new CreateProviderHandler(instance(service), instance(validator));

    test('should return evidence provider for successful POST /providers request', async () => {
        // arrange
        when(validator.parseAndValidate(anything())).thenReturn({
            name: 'provider name',
            description: 'provider description',
            schemas: [
                {
                    schemaId: 'test',
                    content: { valid: true },
                },
            ],
        });
        when(service.createEvidenceProvider(anything(), anything())).thenCall(
            (arg: CreateEvidenceProviderInput) => {
                return {
                    providerId: 'some id',
                    name: arg.name,
                    description: arg.description,
                    enabled: true,
                };
            }
        );

        // act
        const output = await handler.handle(
            {
                headers: { ttl: '5' },
            } as unknown as APIGatewayProxyEvent,
            {} as Context
        );

        // assert
        expect(output).not.toBeUndefined();
        const provider = <EvidenceProviderOutput>JSON.parse(output.body);
        expect(provider.providerId).toBe('some id');
        expect(provider.name).toBe('provider name');
        expect(provider.description).toBe('provider description');
        expect(provider.enabled).toBe(true);
    });
});
