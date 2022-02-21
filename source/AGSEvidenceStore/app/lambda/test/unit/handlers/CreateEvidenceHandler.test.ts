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

import { EvidenceService } from 'src/services/EvidenceService';
import { CreateEvidenceInput } from 'src/types/CreateEvidenceInput';
import { CreateEvidenceHandler } from 'src/handlers/CreateEvidenceHandler';
import { FullEvidenceOutput } from 'src/types/EvidenceOutput';
import { StaticLoggerFactory } from '@apjsb-serverless-lib/logger';
import { CreateEvidenceInputValidator } from 'src/validators/CreateEvidenceInputValidator';

describe('Create evidence handler tests', () => {
    const service: EvidenceService = mock(EvidenceService);
    const validator = mock(CreateEvidenceInputValidator);
    const handler = new CreateEvidenceHandler(
        instance(service),
        instance(validator),
        new StaticLoggerFactory()
    );

    test('should return evidence for successful POST /evidences request', async () => {
        // arrange
        const input: CreateEvidenceInput = {
            providerId: 'providerId',
            targetId: 'a target',
            content: { codeScanResult: 'all good' },
            schemaId: 'schema-id',
        };

        when(validator.parseAndValidate(anything())).thenReturn(input);
        when(service.createEvidence(anything())).thenCall((arg: CreateEvidenceInput) => {
            return {
                evidenceId: '12345',
                providerId: arg.providerId,
                targetId: arg.targetId,
                correlationId: arg.correlationId,
                createdTimestamp: new Date(Date.now()).getTime(),
                content: arg.content,
            };
        });

        // act
        const output = await handler.handle(
            {
                requestContext: { identity: { apiKey: 'my-api-key' } },
            } as APIGatewayProxyEvent,
            {} as Context
        );

        // assert
        expect(output).not.toBeUndefined();
        expect(output.statusCode).toBe(201);
        const evidence = <FullEvidenceOutput>JSON.parse(output.body);
        expect(evidence).not.toBeUndefined();
    });

    test('should return 403 error if request does not have api key', async () => {
        // arrange
        const input: CreateEvidenceInput = {
            providerId: 'providerId',
            targetId: 'a target',
            content: { codeScanResult: 'all good' },
            schemaId: 'schema-id',
        };

        when(validator.parseAndValidate(anything())).thenReturn(input);
        // act
        const output = await handler.handle(
            {
                headers: {},
            } as unknown as APIGatewayProxyEvent,
            {} as Context
        );

        // assert
        expect(output).not.toBeUndefined();
        expect(output.statusCode).toBe(403);
    });
});
