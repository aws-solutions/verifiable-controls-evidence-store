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
import { HttpResponse } from '@aws-sdk/protocol-http';
import { createHttpClient } from '@apjsb-serverless-lib/apjsb-aws-httpclient';
import { backOff } from 'exponential-backoff';
import { Evidence } from '../common/Types';
import AGSError from '../common/AGSError';

const client = createHttpClient(process.env.AWS_REGION!);

export async function recordEvidence(
    evidences: (Evidence | undefined)[],
    evidenceStoreApi: string,
    apiKey: string
): Promise<boolean[]> {
    const backOffOptions = {
        maxDelay: 1000,
        numOfAttempts: 5,
        delayFirstAttempt: false,
        startingDelay: 100,
        timeMultiple: 2,
        /* eslint-disable-next-line */
        retry: (e: any, _attemptNumber: number) => {
            // only(e: any, _attemptNumber: number) => {
            // only retry when EvidenceStores' backend QLDB is throttled
            // RateExceededException, see: https://docs.aws.amazon.com/qldb/latest/developerguide/driver-errors.html

            // check if error is retryable
            return e.retryable;
        },
    };

    const promises = evidences.map(async (x) => {
        const response = await backOff(
            () => saveEvidenceRecord(x, evidenceStoreApi, apiKey),
            backOffOptions
        );

        console.debug(
            `Evidence store response for ${evidenceStoreApi}evidences `,
            response
        );
        return response.statusCode === 201;
    });

    return Promise.all(promises);
}

async function saveEvidenceRecord(
    evidence: any,
    evidenceStoreApi: string,
    apiKey: string
): Promise<HttpResponse> {
    const response = await client.post(
        `${evidenceStoreApi}evidences`,
        'execute-api',
        evidence,
        {
            'X-API-Key': apiKey,
        }
    );

    const responseBody = response.body ? JSON.parse(response.body.toString()) : undefined;
    if (response?.statusCode === 500 || responseBody?.retryable) {
        throw new AGSError(
            `A retryable error occurred while trying to record ${evidence.targetId} from provider ${evidence.providerId}. 
            Error details: [${responseBody?.error}].`,
            500,
            true
        );
    }
    return response;
}
