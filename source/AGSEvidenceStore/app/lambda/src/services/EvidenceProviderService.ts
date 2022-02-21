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
import { EvidenceProviderData } from 'src/data/schemas/EvidenceProviderData';
import { EvidenceProviderRepository } from 'src/data/EvidenceProviderRepository';
import { CreateEvidenceProviderInput } from 'src/types/CreateEvidenceProviderInput';
import { inject, injectable } from 'tsyringe';
import { v4 as uuid } from 'uuid';
import {
    EvidenceProviderOutput,
    CreateEvidenceProviderOutput,
} from 'src/types/EvidenceProviderOutput';
import AGSError from 'src/common/AGSError';
import { CreateEvidenceSchemaInput } from 'src/types/CreateEvidenceSchemaInput';
import { EvidenceSchemaRepository } from 'src/data/EvidenceSchemaRepository';
import { GetEvidenceSchemaInput } from 'src/types/GetEvidenceSchemaInput';
import { EvidenceSchemaOutput } from 'src/types/EvidenceSchemaOutput';
import { ApiKeyRepository } from 'src/data/ApiKeyRepository';
import { computeHash } from './CryptoHelper';
import { QueryOutput } from 'src/types/QueryOutput';
import { SearchEvidenceProviderInput } from 'src/types/SearchEvidenceProviderInput';

@injectable()
export class EvidenceProviderService {
    constructor(
        @inject(EvidenceProviderRepository)
        private repository: EvidenceProviderRepository,
        @inject(EvidenceSchemaRepository)
        private schemaRepo: EvidenceSchemaRepository,
        @inject(ApiKeyRepository)
        private keyRepo: ApiKeyRepository
    ) {}

    async listEvidenceProviders(
        input: SearchEvidenceProviderInput
    ): Promise<QueryOutput<EvidenceProviderOutput>> {
        const results = await this.repository.listEvidenceProvider(
            input.limit,
            input.providerId,
            input.name,
            input.description,
            input.schemaId,
            input.nextToken
        );

        return {
            results: results.records.map((x) => this.mapDataToContract(x)),
            nextToken: results.nextToken,
        };
    }

    async createEvidenceProvider(
        input: CreateEvidenceProviderInput,
        ttl?: number
    ): Promise<CreateEvidenceProviderOutput> {
        const providerId = input.providerId ?? uuid();
        const isProviderValid = await this.repository.isValidProvider(
            input.providerId ?? uuid(),
            input.name
        );
        if (!isProviderValid) {
            throw new AGSError(
                'A provider with the given providerId and/or name already exists.',
                400
            );
        }
        const apiKey = await this.keyRepo.createApiKey(providerId);

        const evidenceProvider: EvidenceProviderData = {
            providerId: providerId,
            name: input.name,
            description: input.description,
            createdTimestamp: new Date(Date.now()).toISOString(),
            enabled: true,
            apiKeyHash: computeHash(apiKey),
            schemaIds:
                input.schemas && input.schemas.length > 0
                    ? input.schemas.map((x) => x.schemaId)
                    : [],
            ttl: ttl && Math.floor((new Date().getTime() + ttl * 60000) / 1000),
        };

        const provider = await this.repository.createEvidenceProvider(evidenceProvider);

        if (input.schemas) {
            await Promise.all(
                input.schemas.map((schema) => {
                    this.schemaRepo.createSchema({
                        providerId: provider.providerId,
                        content: schema.content,
                        schemaId: schema.schemaId,
                        createdTimestamp: new Date().toISOString(),
                        description: schema.description,
                    });
                })
            );
        }

        return {
            ...this.mapDataToContract(provider),
            apiKey: apiKey,
        };
    }

    async getEvidenceProviderById(
        id: string
    ): Promise<EvidenceProviderOutput | undefined> {
        const provider = await this.repository.getEvidenceProvider(id);

        if (provider) {
            return this.mapDataToContract(provider);
        }

        return undefined;
    }

    async toggleProviderStatus(
        id: string,
        enabled: boolean
    ): Promise<EvidenceProviderOutput> {
        try {
            const provider = await this.repository.toggleProviderStatus(id, enabled);

            return this.mapDataToContract(provider);
        } catch (error: any) {
            if (error.code && error.code === 'ConditionalCheckFailedException') {
                throw new AGSError(
                    'Could not find evidence provider with the given providerId.',
                    400,
                    false
                );
            }
            /* istanbul ignore next */
            throw error;
        }
    }

    async createEvidenceSchema(
        input: CreateEvidenceSchemaInput,
        ttl?: number
    ): Promise<void> {
        const provider = await this.repository.getEvidenceProvider(input.providerId);

        if (!provider) {
            throw new AGSError(
                'Could not find evidence provider with the given providerId.',
                400,
                false
            );
        }

        try {
            await this.schemaRepo.createSchema({
                ...input,
                createdTimestamp: new Date().toISOString(),
                ttl: ttl && Math.floor((new Date().getTime() + ttl * 60000) / 1000),
            });

            if (!ttl) {
                // don't update provider record if a ttl is provided
                await this.repository.addSchemaId(input.providerId, input.schemaId);
            }
        } catch (error: any) {
            if (error.code && error.code === 'ConditionalCheckFailedException') {
                throw new AGSError(
                    'A schema with the same id already exists.',
                    400,
                    false
                );
            }
            /* istanbul ignore next */
            throw error;
        }
    }

    async getEvidenceSchema(
        input: GetEvidenceSchemaInput
    ): Promise<EvidenceSchemaOutput | null> {
        const schema = await this.schemaRepo.getSchema(input.providerId, input.schemaId);

        if (schema) {
            return schema;
        }

        return null;
    }

    private mapDataToContract(data: EvidenceProviderData): EvidenceProviderOutput {
        return {
            providerId: data.providerId,
            createdTimestamp: new Date(data.createdTimestamp).toISOString(),
            enabled: data.enabled,
            name: data.name,
            userGroups: data.userGroups,
            description: data.description,
            schemas: data.schemaIds?.map((x) => {
                return { schemaId: x };
            }),
        };
    }
}
