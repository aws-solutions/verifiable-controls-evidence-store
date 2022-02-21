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

import { recordEvidence } from 'src/clients/EvidenceStoreClient';
import { Evidence } from 'src/common/Types';
import { httpPostFn } from 'test/__mocks__/@apjsb-serverless-lib/apjsb-aws-httpclient';

describe('EvidenceStore client tests', () => {
    const evidence: Evidence = {
        providerId: 'provider-789',
        schemaId: 'schema-123',
        targetId: '12345',
        additionalTargetIds: [
            'dev',
            'env-1234',
            'test-app',
            'app-1234',
            'release-123',
            'arn123',
            '12345',
        ],
        content: {
            severity: 'CRITICAL',
            findingId: '12345',
            findingProduct: 'sec hub',
            summary: 'my finding',
            createdAt: 'now',
            updatedAt: 'today',
            status: undefined,
            accountId: '1234',
            region: undefined,
            remediationRecommendation: undefined,
            agsContext: {
                applicationName: 'test-app',
                applicationId: 'app-1234',
                environmentName: 'dev',
                environmentId: 'env-1234',
                releaseId: 'release-123',
            },
            source: 'arn123',
        },
    };

    beforeEach(() => {
        httpPostFn.mockClear();
    });

    test('can invoke evidence store to record new evidence after one 500 response status code', async () => {
        httpPostFn
            .mockResolvedValueOnce({ statusCode: 500 })
            .mockResolvedValueOnce({ statusCode: 201 });

        const result = await recordEvidence([evidence], 'https://localhost/', 'api-key');

        expect(result.length).toBe(1);
        expect(result[0]).toBe(true);
        expect(httpPostFn).toBeCalledTimes(2);
    });

    test('can invoke evidence store to record new evidence after one retryable response error', async () => {
        httpPostFn
            .mockResolvedValueOnce({
                statusCode: 501,
                body: JSON.stringify({ retryable: true, error: 'This strange error' }),
            })
            .mockResolvedValueOnce({ statusCode: 201 });
        const result = await recordEvidence([evidence], 'https://localhost/', 'api-key');

        expect(result.length).toBe(1);
        expect(result[0]).toBe(true);
        expect(httpPostFn).toBeCalledTimes(2);
    });
});
