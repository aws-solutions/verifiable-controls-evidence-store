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
import { anything, deepEqual, instance, mock, reset, when } from 'ts-mockito';

import { EvidenceService } from 'src/services/EvidenceService';
import { GetEvidencesHandler } from 'src/handlers/GetEvidencesHandler';
import { FullEvidenceOutput } from 'src/types/EvidenceOutput';
import { QueryOutput } from 'src/types/QueryOutput';
import { GetEvidencesInputValidator } from 'src/validators/GetEvidencesInputValidator';

describe('GetEvidencesHandler tests', () => {
    const service = mock(EvidenceService);
    const validator = mock(GetEvidencesInputValidator);
    const handler = new GetEvidencesHandler(instance(service), instance(validator));

    beforeEach(() => {
        reset();
    });

    test('returns 200 with evidences', async () => {
        // arrange
        when(validator.parseAndValidate(anything())).thenReturn({
            targetIds: ['target1', 'target2'],
        });
        when(service.getEvidences(anything())).thenResolve({
            results: [
                {
                    evidenceId: '123',
                    providerId: '123',
                    createdTimestamp: new Date().toISOString(),
                    targetId: 'target1',
                    schemaId: 'schema-id',
                    providerName: 'name',
                },
            ],
            total: 1,
        });

        // act
        const result = await handler.handle({} as APIGatewayProxyEvent, {} as Context);

        // assert
        expect(result.statusCode).toBe(200);
        const evidences = <QueryOutput<FullEvidenceOutput>>JSON.parse(result.body);
        expect(evidences.results.length).toBe(1);
        expect(evidences.total).toBe(1);
    });

    test('use limit from input if defined', async () => {
        // arrange
        when(validator.parseAndValidate(anything())).thenReturn({
            targetIds: ['target1', 'target2'],
            limit: 2,
        });

        when(
            service.getEvidences(
                deepEqual({ targetIds: ['target1', 'target2'], limit: 2 })
            )
        ).thenResolve({
            results: [
                {
                    evidenceId: '123',
                    providerId: '123',
                    createdTimestamp: new Date().toISOString(),
                    targetId: 'target1',
                    schemaId: 'schema-id',
                    providerName: 'name',
                },
            ],
            total: 1,
        });

        // act
        const result = await handler.handle({} as APIGatewayProxyEvent, {} as Context);

        // assert
        expect(result.statusCode).toBe(200);
        const evidences = <QueryOutput<FullEvidenceOutput>>JSON.parse(result.body);
        expect(evidences.results.length).toBe(1);
        expect(evidences.total).toBe(1);
    });
});
