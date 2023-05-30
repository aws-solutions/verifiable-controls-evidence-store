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
import * as lambda from 'aws-lambda';
import * as secrets from '@aws-sdk/client-secrets-manager';

import { createHttpClient } from '@apjsb-serverless-lib/apjsb-aws-httpclient';

const httpClient = createHttpClient(process.env.AWS_REGION!);
const secretsManager = new secrets.SecretsManager({});

export async function handler(
    event: lambda.CloudFormationCustomResourceEvent,
    _context: lambda.Context
): Promise<lambda.CloudFormationCustomResourceResponse> {
    console.debug(`Processing event ${JSON.stringify(event)}`);
    const physicalResourceId = 'evidence-provider-creator';

    try {
        if (event.RequestType === 'Create') {
            console.debug('Processing Create event');
            const apiKey = await onboardEvidenceProvider(
                event.ResourceProperties.EvidenceStoreUri,
                event.ResourceProperties.ProviderId,
                event.ResourceProperties.SchemaId
            );

            await secretsManager.send(
                new secrets.UpdateSecretCommand({
                    SecretId: event.ResourceProperties.SecretId,
                    SecretString: apiKey,
                })
            );
        }

        return {
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            PhysicalResourceId: physicalResourceId,
            StackId: event.StackId,
            Status: 'SUCCESS',
        };
    } catch (error: any) {
        console.error('An error occurred while processing the event', error);
        return {
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            PhysicalResourceId: physicalResourceId,
            StackId: event.StackId,
            Status: 'FAILED',
            Reason: error,
        };
    }
}

async function onboardEvidenceProvider(
    baseApiUrl: string,
    providerId: string,
    schemaId: string
): Promise<string | undefined> {
    const createProviderResponse = await httpClient.post(
        `${baseApiUrl}providers`,
        'execute-api',
        {
            providerId,
            name: 'S3 Evidence Collector',
            description: 'This provider creates evidences for new S3 objects',
            schemas: [
                {
                    schemaId: schemaId,
                    content: {
                        $schema: 'http://json-schema.org/draft-04/schema#',
                        properties: {
                            originalBucketName: {
                                type: 'string',
                            },
                            originalObjectKey: {
                                type: 'string',
                            },
                            uploadPrincipalId: {
                                type: 'string',
                            },
                            objectSize: {
                                type: 'number',
                            },
                        },
                        required: [
                            'originalBucketName',
                            'originalObjectKey',
                            'uploadPrincipalId',
                            'objectSize',
                        ],
                        type: 'object',
                    },
                },
            ],
        },
        { 'User-Agent': 'Chrome/85.0.4182.0' }
    );

    if (createProviderResponse.statusCode !== 201) {
        console.log(`createProviderResponse`, createProviderResponse);
        throw `Received a non successful response from evidence store - status code ${
            createProviderResponse.statusCode
        } - data ${createProviderResponse.body.toString()}`;
    }

    console.info(`Successfully onboarded evidence provider with id ${providerId}`);

    return JSON.parse(createProviderResponse.body.toString()).apiKey;
}
