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
import { sleep } from './CanaryHelper';
import { TestCases } from './TestCases';
import * as ssm from '@aws-sdk/client-ssm';
import { log } from './canaryUtils';

const queueUrl: string = process.env.RATE_LIMIT_QUEUE_URL || '';

export async function handler(): Promise<void> {
    const client = new ssm.SSMClient({});
    const paramName = process.env.EVIDENCE_STORE_API_SSM || '';
    const result = await client.send(new ssm.GetParameterCommand({ Name: paramName }));

    log(JSON.stringify(result));
    if (!result?.Parameter?.Value) {
        throw new Error(`String value not available in SSM parameter ${paramName}`);
    }

    const evidenceStoreApiEndpoint = result.Parameter.Value;
    const endpointReg = /https:\/\/(.+)\/(.+)\//;
    const urlParts = evidenceStoreApiEndpoint.match(endpointReg);

    if (urlParts) {
        const hostname = urlParts[1] || '';
        const stageName = urlParts[2] || '';

        const testCases = new TestCases(hostname, stageName);
        const testResourceArns = [
            'arn:aws:s3:::finding-test-bucket-one',
            'arn:aws:s3:::finding-test-bucket-two',
        ];

        // inject test finding with an sqs message
        await testCases.generateSQSFinding(queueUrl, testResourceArns);

        await sleep(3000);

        // search evidence by targetId and validate it contains those targetIds
        const evidences = await testCases.searchEvidence(testResourceArns);
        testCases.evidencesContainTargetIds(evidences, testResourceArns);
    } else {
        throw 'Invalid api endpoint';
    }
}
