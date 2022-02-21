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
import { GetEvidenceVerificationStatusHandler } from 'src/handlers/GetEvidenceVerificationStatusHandler';
import { EvidenceService } from 'src/services/EvidenceService';
import { instance, mock, when } from 'ts-mockito';

describe('GetEvidenceVerificationStatusHandler tests', () => {
    const service = mock(EvidenceService);
    const handler = new GetEvidenceVerificationStatusHandler(instance(service));

    test('returns 400 if no path parameter', async () => {
        const result = () => handler.handle({} as APIGatewayProxyEvent, {} as Context);

        await expect(result()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('returns 400 if no id path parameter', async () => {
        const result = () =>
            handler.handle(
                { pathParameters: { test: 'value' } } as unknown as APIGatewayProxyEvent,
                {} as Context
            );

        await expect(result()).rejects.toEqual({
            message: 'id path parameter is required and cannot be null or empty.',
            statusCode: 400,
            retryable: false,
            name: 'AGSError',
        });
    });

    test('returns verification status', async () => {
        const result = await handler.handle(
            { pathParameters: { id: '1234' } } as unknown as APIGatewayProxyEvent,
            {} as Context
        );
        when(service.verifyEvidence('1234')).thenResolve({
            verificationStatus: 'Verified',
        });

        expect(result.statusCode).toBe(200);
    });
});
