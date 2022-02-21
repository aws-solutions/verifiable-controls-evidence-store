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
import { inject, injectable } from 'tsyringe';
import * as aws from 'aws-sdk';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import { EvidenceSchemaData } from './schemas/EvidenceProviderData';

@injectable()
export class EvidenceSchemaRepository {
    private readonly tableName: string;
    constructor(
        @inject('DocumentClient') private db: aws.DynamoDB.DocumentClient,
        @inject('AppConfiguration') appConfig: AppConfiguration
    ) {
        this.tableName = appConfig.evidenceSchemaTableName;
    }

    async createSchema(data: EvidenceSchemaData): Promise<void> {
        await this.db
            .put({
                TableName: this.tableName,
                Item: data,
                ConditionExpression:
                    'attribute_not_exists(schemaId) AND attribute_not_exists(providerId)',
            })
            .promise();
    }

    async getSchema(
        providerId: string,
        schemaId: string
    ): Promise<EvidenceSchemaData | null> {
        const result = await this.db
            .get({
                TableName: this.tableName,
                Key: { schemaId: schemaId, providerId: providerId },
            })
            .promise();

        return <EvidenceSchemaData>result.Item;
    }

    async getSchemas(providerId: string): Promise<EvidenceSchemaData[]> {
        const result = await this.db
            .query({
                TableName: this.tableName,
                IndexName: 'providerId',
                KeyConditionExpression: 'providerId = :providerId',
                ExpressionAttributeValues: {
                    ':providerId': providerId,
                },
            })
            .promise();

        return <EvidenceSchemaData[]>result.Items;
    }
}
