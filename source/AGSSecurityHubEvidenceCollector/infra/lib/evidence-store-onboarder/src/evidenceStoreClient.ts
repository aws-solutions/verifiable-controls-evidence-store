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
import * as client from '@apjsb-serverless-lib/apjsb-aws-httpclient';

const httpClient = client.createHttpClient(process.env.AWS_REGION!);

export async function onboardEvidenceProvider(
    baseApiUrl: string,
    providerId: string,
    schemaId: string
): Promise<string | undefined> {
    // check for existing
    const getProviderResponse = await httpClient.get(
        `${baseApiUrl}providers/${providerId}`,
        'execute-api',
        { 'User-Agent': 'Chrome/85.0.4182.0' }
    );

    if (getProviderResponse.statusCode === 200) {
        // provider already onboarded, do nothing
        console.info(
            `Evidence provider with id ${providerId} already onboarded, doing nothing now`
        );
        return undefined;
    }

    if (getProviderResponse.statusCode !== 404) {
        console.error(`Invalid getProviderReponse`, getProviderResponse);
        // we're not getting a 404, which means something is wrong with evidence provider, blowing up now
        throw `Received a non successful response from evidence store - status code ${
            getProviderResponse.statusCode
        } - data ${getProviderResponse.body.toString()}`;
    }

    // onboard a new provider
    const createProviderResponse = await httpClient.post(
        `${baseApiUrl}providers`,
        'execute-api',
        {
            providerId,
            name: 'Security Hub Evidence Collector',
            description:
                'This provider collects evidences from Amazon Security Hub findings',
            schemas: [
                {
                    providerId,
                    schemaId: schemaId,
                    content: {
                        $schema: 'http://json-schema.org/draft-07/schema#',
                        $ref: '#/definitions/Content',
                        definitions: {
                            Content: {
                                type: 'object',
                                properties: {
                                    source: {
                                        type: 'string',
                                    },
                                    severity: {
                                        type: 'string',
                                        enum: [
                                            'INFORMATIONAL',
                                            'LOW',
                                            'MEDIUM',
                                            'HIGH',
                                            'CRITICAL',
                                        ],
                                    },
                                    findingId: {
                                        type: 'string',
                                    },
                                    findingProduct: {
                                        type: 'string',
                                    },
                                    summary: {
                                        type: 'string',
                                    },
                                    createdAt: {
                                        type: 'string',
                                    },
                                    updatedAt: {
                                        type: 'string',
                                    },
                                    accountId: {
                                        type: 'string',
                                    },
                                    region: {
                                        type: 'string',
                                    },
                                    status: {
                                        type: 'string',
                                        enum: [
                                            'NEW',
                                            'NOTIFIED',
                                            'SUPPRESSED',
                                            'ASSIGNED',
                                            'IN_PROGRESS',
                                            'RESOLVED',
                                            'DEFERRED',
                                            'DUPLICATE',
                                        ],
                                    },
                                    remediationRecommendation: {
                                        type: 'object',
                                        properties: {
                                            text: {
                                                type: 'string',
                                            },
                                            url: {
                                                type: 'string',
                                            },
                                        },
                                        additionalProperties: false,
                                    },
                                    agsContext: {
                                        type: 'object',
                                        properties: {
                                            applicationName: {
                                                type: 'string',
                                            },
                                            applicationId: {
                                                type: 'string',
                                            },
                                            environmentName: {
                                                type: 'string',
                                            },
                                            environmentId: {
                                                type: 'string',
                                            },
                                            releaseId: {
                                                type: 'string',
                                            },
                                            deploymentId: {
                                                type: 'string',
                                            },
                                        },
                                        additionalProperties: false,
                                    },
                                },
                                required: [
                                    'source',
                                    'severity',
                                    'findingId',
                                    'findingProduct',
                                    'summary',
                                    'createdAt',
                                    'updatedAt',
                                    'accountId',
                                ],
                                additionalProperties: false,
                            },
                        },
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
