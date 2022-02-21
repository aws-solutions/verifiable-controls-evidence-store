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

import * as crypto from 'crypto';
import * as XRAY from 'aws-xray-sdk';
import * as aws from 'aws-sdk';
import {
    EvidenceProviderData,
    EvidenceSchemaData,
} from '../../../../app/lambda/src/data/schemas/EvidenceProviderData';
import {
    CloudFormationCustomResourceEvent,
    CloudFormationCustomResourceFailedResponse,
    CloudFormationCustomResourceResponseCommon,
    CloudFormationCustomResourceSuccessResponse,
    Context,
} from 'aws-lambda';
import { QldbDriver } from 'amazon-qldb-driver-nodejs';
XRAY.captureAWS(aws);

export async function onEvent(
    event: CloudFormationCustomResourceEvent,
    _context: Context
): Promise<CloudFormationCustomResourceResponseCommon> {
    console.log(`Processing request: `, event);
    const physicalResourceId = `${event.ResourceProperties.LedgerName}.${event.ResourceProperties.TableName}`;

    try {
        if (event.RequestType === 'Create') {
            console.log('Processing Create event');
            await Promise.all([
                createQldbTableAndIndex(event),
                createCanaryEvidenceProvider(event),
            ]);
            return success(event, physicalResourceId);
        } else if (event.RequestType === 'Update') {
            console.log('Processing Update event');
            await createCanaryEvidenceProvider(event);
            return success(event, physicalResourceId);
        } else {
            // do nothing for other request types
            return success(event, physicalResourceId);
        }
    } catch (error) {
        return failed(event, physicalResourceId, error as string);
    }
}

async function createQldbTableAndIndex(
    event: CloudFormationCustomResourceEvent
): Promise<void> {
    const qldb = new QldbDriver(event.ResourceProperties.LedgerName);
    const result = await qldb.executeLambda(async (txn) => {
        const createTableResult = await txn.execute(
            `CREATE TABLE ${event.ResourceProperties.TableName}`
        );
        console.log('QLDB Create table result ', createTableResult);
        const createIndexResult = await txn.execute(
            `CREATE INDEX ON ${event.ResourceProperties.TableName} (${event.ResourceProperties.IndexField})`
        );
        console.log('QLDB Create index result ', createIndexResult);
    });
    console.log('QLDB result ', result);
}

async function createCanaryEvidenceProvider(
    event: CloudFormationCustomResourceEvent
): Promise<void> {
    const ddb = new aws.DynamoDB.DocumentClient();

    const tableName = event.ResourceProperties.AuthorityTableName;

    const authority: EvidenceProviderData = {
        providerId: 'canary-authority',
        createdTimestamp: new Date().toISOString(),
        enabled: true,
        name: 'canary-authority',
        apiKeyHash: computeHash(event.ResourceProperties.CanaryAuthorityApiKey),
        schemaIds: ['canary-test-schema'],
    };

    console.log(`Inserting canary authority to ${tableName} table.`);
    const authorityResult = await ddb
        .put({ TableName: tableName, Item: authority })
        .promise();
    console.log('Authority result, ', authorityResult);

    const schemaTableName = event.ResourceProperties.SchemaTableName;
    const schema: EvidenceSchemaData = {
        providerId: 'canary-authority',
        schemaId: 'canary-test-schema',
        content: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                codeCoverage: {
                    type: 'string',
                },
                executionId: {
                    type: 'string',
                },
            },
            required: ['codeCoverage', 'executionId'],
        },
        createdTimestamp: new Date().toISOString(),
    };

    console.log(`Inserting canary authority's schema to ${schemaTableName} table.`);
    const schemaResult = await ddb
        .put({ TableName: schemaTableName, Item: schema })
        .promise();
    console.log(`Schema result, `, schemaResult);
}

function success(
    event: CloudFormationCustomResourceEvent,
    physicalResourceId: string
): CloudFormationCustomResourceSuccessResponse {
    return {
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: physicalResourceId,
        StackId: event.StackId,
        Status: 'SUCCESS',
    };
}

function failed(
    event: CloudFormationCustomResourceEvent,
    physicalResourceId: string,
    reason: string
): CloudFormationCustomResourceFailedResponse {
    return {
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: physicalResourceId,
        StackId: event.StackId,
        Status: 'FAILED',
        Reason: reason,
    };
}

function computeHash(input: string): string {
    const hash = crypto.createHash('sha256');

    hash.update(input);

    return hash.digest().toString('base64');
}
