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

const evidenceStoreApi: string = process.env.EVIDENCE_STORE_API!;

export async function handler() {
    const endpointReg = /https:\/\/(.+)\/(.+)\//;
    const urlParts = evidenceStoreApi.match(endpointReg);

    if (urlParts) {
        const hostname = urlParts[1];
        const stageName = urlParts[2];

        const testCases = new TestCases(hostname, stageName);

        // get provider
        const getProviderResponse = await testCases.getProvider('canary-authority');

        // add new schema
        const schemaId = await testCases.createSchema(getProviderResponse!.providerId);

        // get schema
        await testCases.getSchema(getProviderResponse!.providerId, schemaId);

        // create evidence
        const createEvidenceResponse = await testCases.createEvidence(
            getProviderResponse!,
            process.env.API_KEY!
        );

        // disable provider
        await testCases.disableProvider(getProviderResponse!.providerId);

        // enable provider
        await testCases.enableProvider(getProviderResponse!.providerId);

        // list providers
        await testCases.listProviders();

        await sleep(3000);

        // get evidence by id
        await testCases.getEvidence(createEvidenceResponse!.evidenceId);

        // get evidences by targetIds
        await testCases.getEvidences([createEvidenceResponse!.targetId]);

        // get evidence revisions
        await testCases.getEvidenceRevisions(createEvidenceResponse!.evidenceId);
    } else {
        throw 'Invalid api endpoint';
    }
}
