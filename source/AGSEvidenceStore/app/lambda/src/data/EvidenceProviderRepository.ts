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
import * as aws from 'aws-sdk';

import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import { EvidenceProviderData } from './schemas/EvidenceProviderData';
import { inject, injectable } from 'tsyringe';
import { DynamoDbQueryResult } from './schemas/QueryResult';

@injectable()
export class EvidenceProviderRepository {
    private readonly tableName: string;
    constructor(
        @inject('DocumentClient') private db: aws.DynamoDB.DocumentClient,
        @inject('AppConfiguration') appConfig: AppConfiguration
    ) {
        this.tableName = appConfig.evidenceProviderTableName;
    }

    async isValidProvider(providerId: string, name: string): Promise<boolean> {
        const provider = await this.getEvidenceProvider(providerId);
        if (provider) {
            return false;
        }

        const providerByName = await this.db
            .scan({
                TableName: this.tableName,
                FilterExpression: '#name = :name',
                ExpressionAttributeNames: { '#name': 'name' },
                ExpressionAttributeValues: { ':name': name },
            })
            .promise();

        if (providerByName.Items && providerByName.Items.length > 0) return false;
        return true;
    }

    async createEvidenceProvider(
        provider: EvidenceProviderData
    ): Promise<EvidenceProviderData> {
        await this.db
            .put({
                TableName: this.tableName,
                Item: provider,
            })
            .promise();

        return provider;
    }

    async listEvidenceProvider(
        limit: number,
        providerId?: string,
        name?: string,
        description?: string,
        schemaId?: string,
        nextToken?: string
    ): Promise<DynamoDbQueryResult<EvidenceProviderData>> {
        const filterExpressions: string[] = [];

        if (providerId) {
            filterExpressions.push('contains(providerId, :providerIdValue)');
        }
        if (name) {
            filterExpressions.push('contains(#n, :nameValue)');
        }
        if (description) {
            filterExpressions.push('contains(description, :descriptionValue)');
        }
        if (schemaId) {
            filterExpressions.push('contains(schemaIds, :schemaIdValue)');
        }

        const filterExpressionValue =
            filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined;

        const result = await this.db
            .scan({
                TableName: this.tableName,
                Limit: limit,
                ExclusiveStartKey: nextToken ? { providerId: nextToken } : undefined,
                FilterExpression: filterExpressionValue,
                ExpressionAttributeNames: name ? { '#n': 'name' } : undefined,
                ExpressionAttributeValues: filterExpressionValue
                    ? {
                          ':providerIdValue': providerId,
                          ':nameValue': name,
                          ':descriptionValue': description,
                          ':schemaIdValue': schemaId,
                      }
                    : undefined,
            })
            .promise();

        return {
            pageSize: limit,
            records: result.Items ? <EvidenceProviderData[]>result.Items : [],
            nextToken: result.LastEvaluatedKey?.providerId,
        };
    }

    async getEvidenceProvider(
        providerId: string
    ): Promise<EvidenceProviderData | undefined> {
        const result = await this.db
            .get({
                TableName: this.tableName,
                Key: { providerId: providerId },
            })
            .promise();

        return <EvidenceProviderData>result.Item;
    }

    async toggleProviderStatus(
        providerId: string,
        enabled: boolean
    ): Promise<EvidenceProviderData> {
        const result = await this.db
            .update({
                TableName: this.tableName,
                Key: { providerId: providerId },
                ReturnValues: 'ALL_NEW',
                ConditionExpression: 'attribute_exists(providerId)',
                UpdateExpression: 'set enabled = :value',
                ExpressionAttributeValues: {
                    ':value': enabled,
                },
            })
            .promise();

        return <EvidenceProviderData>result.Attributes;
    }

    async addSchemaId(providerId: string, schemaId: string): Promise<void> {
        await this.db
            .update({
                TableName: this.tableName,
                Key: { providerId: providerId },
                UpdateExpression:
                    'SET schemaIds = list_append(if_not_exists(schemaIds, :emptyList), :newSchemaId)',
                ExpressionAttributeValues: {
                    ':newSchemaId': [schemaId],
                    ':emptyList': [],
                },
            })
            .promise();
    }
}
