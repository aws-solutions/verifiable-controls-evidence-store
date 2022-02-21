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
import { EvidenceProviderOutput } from '../src/types/EvidenceProviderOutput';
import { FullEvidenceOutput } from '../src/types/EvidenceOutput';
import { CreateEvidenceInput } from '../src/types/CreateEvidenceInput';
import { UpdateEvidenceProviderInput } from '../src/types/UpdateEvidenceProviderInput';
import { EvidenceSchemaOutput } from '../src/types/EvidenceSchemaOutput';
import { GetEvidencesInput } from '../src/types/GetEvidencesInput';
import { QueryOutput } from '../src/types/QueryOutput';
import { v4 as uuid } from 'uuid';
import { callback, createRequest, testApi } from './canaryUtils';

export class TestCases {
    constructor(private hostname: string, private stageName: string) {}

    async getProvider(id: string): Promise<EvidenceProviderOutput | undefined> {
        const request = createRequest(
            'GET',
            this.hostname,
            `/${this.stageName}/providers/${id}`
        );

        let result: EvidenceProviderOutput | undefined = undefined;

        await testApi('Get Provider By Id', request, async (response: any) => {
            result = await callback(response, 200);
        });

        return result;
    }

    async createSchema(providerId: string): Promise<string> {
        const schemaId = uuid().toString();
        const request = createRequest(
            'POST',
            this.hostname,
            `/${this.stageName}/providers/${providerId}/schemas`,
            {
                content: { codeCoverage: { type: 'sring' } },
                schemaId: schemaId,
                providerId: providerId,
            }
        );

        await testApi('Create Evidence Schema', request);

        return schemaId;
    }

    async getSchema(
        providerId: string,
        schemaId: string
    ): Promise<EvidenceSchemaOutput | undefined> {
        const request = createRequest(
            'GET',
            this.hostname,
            `/${this.stageName}/providers/${providerId}/schemas/${schemaId}`
        );

        let schema: EvidenceSchemaOutput | undefined = undefined;

        await testApi('Get Evidence Schema By Id', request, async (res: any) => {
            schema = await callback(res, 200);
        });

        return schema;
    }

    async createEvidence(
        provider: EvidenceProviderOutput,
        apiKey: string
    ): Promise<FullEvidenceOutput | undefined> {
        const input: CreateEvidenceInput = {
            providerId: provider.providerId,
            content: { codeCoverage: '80%', executionId: uuid().toString() },
            targetId: 'canary',
            schemaId: 'canary-test-schema',
        };

        const request = createRequest(
            'POST',
            this.hostname,
            `/${this.stageName}/evidences`,
            input,
            {
                'x-api-key': apiKey,
            }
        );

        let evidence: FullEvidenceOutput | undefined = undefined;

        await testApi('Create Evidence', request, async (res: any) => {
            evidence = await callback(res, 201);
        });

        return evidence;
    }

    disableProvider(id: string): Promise<EvidenceProviderOutput | undefined> {
        return this.toggleProvider(id, false);
    }

    enableProvider(id: string): Promise<EvidenceProviderOutput | undefined> {
        return this.toggleProvider(id, true);
    }

    async getEvidence(id: string): Promise<FullEvidenceOutput | undefined> {
        const request = createRequest(
            'GET',
            this.hostname,
            `/${this.stageName}/evidences/${id}`
        );

        let evidence: FullEvidenceOutput | undefined = undefined;

        await testApi('Get Evidence By Id', request, async (res: any) => {
            evidence = await callback(res, 200);
        });

        return evidence;
    }

    async getEvidences(
        targetIds: string[]
    ): Promise<QueryOutput<FullEvidenceOutput> | undefined> {
        const input: GetEvidencesInput = {
            targetIds,
        };

        const request = createRequest(
            'POST',
            this.hostname,
            `/${this.stageName}/evidences/search`,
            input
        );

        let results: QueryOutput<FullEvidenceOutput> | undefined = undefined;

        await testApi('Search Evidences', request, async (res: any) => {
            results = await callback(res, 200);
        });

        return results;
    }

    async listProviders(): Promise<QueryOutput<EvidenceProviderOutput> | undefined> {
        const request = createRequest(
            'GET',
            this.hostname,
            `/${this.stageName}/providers`
        );

        let results: QueryOutput<EvidenceProviderOutput> | undefined = undefined;

        await testApi('List Evidence Providers', request, async (res: any) => {
            results = await callback(res, 200);
        });

        return results;
    }

    async getEvidenceRevisions(evidenceId: string): Promise<void> {
        const request = createRequest(
            'GET',
            this.hostname,
            `/${this.stageName}/evidences/${evidenceId}/revisions`
        );

        await testApi('Get Evidence Revisions', request);
    }

    private async toggleProvider(
        id: string,
        enabled: boolean
    ): Promise<EvidenceProviderOutput | undefined> {
        const input: UpdateEvidenceProviderInput = {
            providerId: id,
            enabled: enabled,
        };

        const request = createRequest(
            'PUT',
            this.hostname,
            `/${this.stageName}/providers/${id}`,
            input
        );

        let provider: EvidenceProviderOutput | undefined = undefined;

        await testApi(
            `Toggle Provider Status to ${enabled}`,
            request,
            async (res: any) => {
                provider = await callback(res, 200);
            }
        );

        return provider;
    }
}
