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
import * as aws from 'aws-sdk';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import { EvidenceSchemaRepository } from 'src/data/EvidenceSchemaRepository';

describe.skip('EvidenceSchemaRepository tests', () => {
    const config = new AppConfiguration('test');

    const ddb = new aws.DynamoDB.DocumentClient({
        convertEmptyValues: false,
        endpoint: 'localhost:8000',
        sslEnabled: false,
        region: 'local-env',
    });

    const repo = new EvidenceSchemaRepository(ddb, config);

    test('can create new schema', async () => {
        // act
        await repo.createSchema({
            providerId: '1234',
            schemaId: '1234',
            content: { test: true },
            createdTimestamp: new Date().toISOString(),
        });

        // assert
        const schemas = await ddb
            .scan({ TableName: config.evidenceSchemaTableName })
            .promise();

        expect(schemas.Items?.length).toBe(1);
    });

    test('can get schema by providerId', async () => {
        // arrange
        await repo.createSchema({
            providerId: '1234',
            schemaId: '12345',
            content: { test: true },
            createdTimestamp: new Date().toISOString(),
        });

        // act
        const schemas = await repo.getSchemas('1234');
        expect(schemas.length > 0).toBe(true);
    });

    test('can get schema by schema id', async () => {
        // act
        const schema = await repo.getSchema('1234', '1234');

        // assert
        expect(schema).not.toBeUndefined();
        expect(schema?.schemaId).toBe('1234');
        expect(schema?.providerId).toBe('1234');
        expect(schema?.createdTimestamp).toBeDefined();
    });
});
