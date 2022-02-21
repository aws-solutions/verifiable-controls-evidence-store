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
import { StaticLoggerFactory } from '@apjsb-serverless-lib/logger';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import { GetAttachmentLinkHandler } from 'src/handlers/GetAttachmentLinkHandler';
import { EvidenceService } from 'src/services/EvidenceService';
import { instance, mock, when } from 'ts-mockito';
import { FullEvidenceOutput } from 'src/types/EvidenceOutput';

jest.useFakeTimers();

describe('GetAttachmentLinkHandler tests', () => {
    const service = mock(EvidenceService);
    const handler = new GetAttachmentLinkHandler(
        instance(service),
        new AppConfiguration('test'),
        new StaticLoggerFactory()
    );

    test.each([
        [undefined, '1234'],
        ['1234', undefined],
        [undefined, undefined],
    ])(
        'returns 400 if no evidenceId or no attachmentId',
        async (evidenceId: string | undefined, attachmentId: string | undefined) => {
            // act
            const result = () =>
                handler.handle(getEvent(evidenceId, attachmentId), {} as Context);

            // assert
            await expect(result()).rejects.toMatchObject({
                statusCode: 400,
                retryable: false,
                name: 'AGSError',
            });
        }
    );

    test('returns 404 if evidence not found', async () => {
        // arrange
        when(service.getEvidenceById('1234', undefined)).thenResolve(undefined);

        // act
        const result = await handler.handle(getEvent('1234', '1234'), {} as Context);

        // assert
        expect(result.statusCode).toBe(404);
    });

    test('return 404 if attachment not found', async () => {
        // arrange
        when(service.getEvidenceById('1234', undefined)).thenResolve({
            attachments: [{ attachmentId: '3456', objectKey: 'key' }],
        } as FullEvidenceOutput);

        // act
        const result = await handler.handle(getEvent('1234', '1234'), {} as Context);

        // assert
        expect(result.statusCode).toBe(404);
    });

    test('return pre-signed url for attachment', async () => {
        // arrange
        when(service.getEvidenceById('1234', undefined)).thenResolve({
            attachments: [{ attachmentId: '1234', objectKey: 'key' }],
        } as FullEvidenceOutput);

        // act
        // act
        const result = await handler.handle(getEvent('1234', '1234'), {} as Context);

        // assert
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).url).not.toBeUndefined();
    });
});

function getEvent(
    evidenceId: string | undefined,
    attachmentId: string | undefined
): APIGatewayProxyEvent {
    return {
        pathParameters: {
            id: evidenceId,
            attachmentId,
        },
    } as unknown as APIGatewayProxyEvent;
}
