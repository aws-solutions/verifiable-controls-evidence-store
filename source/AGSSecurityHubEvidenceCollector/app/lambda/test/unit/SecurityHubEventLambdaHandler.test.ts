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
import { SQSEvent } from 'aws-lambda';
import { SSMParameterClient } from 'src/clients/SSMParameterClient';
import { SecretsManagerClient } from 'src/clients/SecretManagerClient';
import { SecurityHubEventProcessor } from 'src/SecurityHubEventProcessor';
import { assumeRoleResponse } from 'test/__mocks__/@aws-sdk/client-sts';
import { getParameterResponse } from 'test/__mocks__/@aws-sdk/client-ssm';
import { getResourcesResponse } from 'test/__mocks__/@aws-sdk/client-resource-groups-tagging-api';
import { getSecretsResponse } from 'test/__mocks__/@aws-sdk/client-secrets-manager';
import { httpPostFn } from 'test/__mocks__/@apjsb-serverless-lib/apjsb-aws-httpclient';
import { lambdaHandler } from 'src/App';
import { putObjectResponse } from 'test/__mocks__/@aws-sdk/client-s3';

describe('Lambda handler tests with security hub finding events', () => {
    beforeEach(() => {
        process.env.EVIDENCE_STORE_API_SSM = 'EvidenceStoreClientApiEndpointName';
        process.env.FINDING_SOURCE_PRODUCT_ARNS_SSM = 'FindingSourceProductArnsName';
        process.env.EVIDENCE_ATTACHMENT_BUCKET_PARAM = 'FindingsBucket';
        process.env.API_SECRET_NAME = 'ApiSecretName';
        getResourcesResponse.mockClear();
        getSecretsResponse.mockClear();
        getParameterResponse.mockClear();
        putObjectResponse.mockClear();
        httpPostFn.mockClear();
        // @ts-ignore
        SSMParameterClient._instance = undefined;
        // @ts-ignore
        SecretsManagerClient._instance = undefined;
        // @ts-ignore
        SecurityHubEventProcessor._instance = undefined;

        assumeRoleResponse.mockResolvedValueOnce({
            Credentials: {
                SecretAccessKey: 'secret',
                AccessKeyId: 'access',
                Expiration: 'expr',
                SessionToken: 'token',
            },
        });
    });

    test('throw error if product arns for matched findings cannot be retrieved', async () => {
        delete process.env.FINDING_SOURCE_PRODUCT_ARNS_SSM;
        getParameterResponse
            .mockResolvedValueOnce({
                Parameter: { Value: 'http://localhost' },
            })
            .mockResolvedValueOnce({ Parameter: { Value: '' } });
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        await expect(
            lambdaHandler(generateSecurityHubEvent('macie'), {})
        ).rejects.toThrow();

        expect(getSecretsResponse).toHaveBeenCalledTimes(1);
        expect(getParameterResponse).toHaveBeenCalledTimes(2);

        expect(getResourcesResponse).not.toHaveBeenCalled();
        expect(httpPostFn).not.toHaveBeenCalled();
        expect(putObjectResponse).not.toHaveBeenCalled();
    });

    test('do nothing if event does not contain matched finding', async () => {
        getParameterResponse
            .mockResolvedValueOnce({
                Parameter: { Value: 'http://localhost' },
            })
            .mockResolvedValueOnce({ Parameter: { Value: 'macie$,guardduty$' } });
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        await lambdaHandler(generateSecurityHubEvent(), {});

        expect(getSecretsResponse).toHaveBeenCalledTimes(1);
        expect(getParameterResponse).toHaveBeenCalledTimes(2);

        expect(getResourcesResponse).not.toHaveBeenCalled();
        expect(httpPostFn).not.toHaveBeenCalled();
        expect(putObjectResponse).not.toHaveBeenCalled();
    });

    test('can record new evidences', async () => {
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockResolvedValueOnce({ statusCode: 201 });
        getParameterResponse
            .mockResolvedValueOnce({
                Parameter: { Value: 'http://localhost' },
            })
            .mockResolvedValueOnce({ Parameter: { Value: 'macie$,guardduty$' } })
            .mockResolvedValueOnce({ Parameter: { Value: 'bucket' } });
        await lambdaHandler(generateSecurityHubEvent('macie'), {});

        expect(getSecretsResponse).toHaveBeenCalledTimes(1);
        expect(httpPostFn).toHaveBeenCalledTimes(1);
        expect(getParameterResponse).toHaveBeenCalledTimes(3);
        expect(putObjectResponse).toHaveBeenCalledTimes(1);
    });

    test('does nothing when response to record new evidences is empty', async () => {
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockResolvedValueOnce({});
        getParameterResponse
            .mockResolvedValueOnce({
                Parameter: { Value: 'http://localhost' },
            })
            .mockResolvedValueOnce({ Parameter: { Value: 'macie$,guardduty$' } })
            .mockResolvedValueOnce({ Parameter: { Value: 'bucket' } });
        await lambdaHandler(generateSecurityHubEvent('macie'), {});

        expect(getSecretsResponse).toHaveBeenCalledTimes(1);
        expect(httpPostFn).toHaveBeenCalledTimes(1);
        expect(getParameterResponse).toHaveBeenCalledTimes(3);
        expect(putObjectResponse).toHaveBeenCalledTimes(1);
    });

    test('throws error when failing to record new evidences', async () => {
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockRejectedValueOnce({ statusCode: 404 });
        getParameterResponse
            .mockResolvedValueOnce({
                Parameter: { Value: 'http://localhost' },
            })
            .mockResolvedValueOnce({ Parameter: { Value: 'macie$,guardduty$' } });
        const task = () => lambdaHandler(generateSecurityHubEvent('macie'), {});

        await expect(task).rejects.toThrowError();
    });

    test('throws error when evidence store api endpoint name is undefined', async () => {
        delete process.env.EVIDENCE_STORE_API_SSM;
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockResolvedValueOnce({ statusCode: 201 });
        getParameterResponse
            .mockResolvedValueOnce({
                Parameter: { Value: 'http://localhost' },
            })
            .mockResolvedValueOnce({ Parameter: { Value: 'macie$,guardduty$' } });
        const task = () => lambdaHandler(generateSecurityHubEvent('macie'), {});

        await expect(task).rejects.toThrowError();
    });

    test('throws error when evidence store api secret name is undefined', async () => {
        delete process.env.API_SECRET_NAME;
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockResolvedValueOnce({ statusCode: 201 });
        getParameterResponse
            .mockResolvedValueOnce({
                Parameter: { Value: 'http://localhost' },
            })
            .mockResolvedValueOnce({ Parameter: { Value: 'macie$,guardduty$' } });
        const task = () => lambdaHandler(generateSecurityHubEvent('macie'), {});

        await expect(task).rejects.toThrowError();
    });
});

function generateSecurityHubEvent(productArn?: string): SQSEvent {
    return {
        Records: [
            {
                messageId: '87538e2a-f32a-4444-b0eb-e9df67e8a8ad',
                receiptHandle: '123',
                attributes: {
                    ApproximateReceiveCount: '1',
                    SentTimestamp: '1631849882383',
                    SequenceNumber: '18864497643599602176',
                    MessageGroupId: 'sechub-finding',
                    SenderId: 'AROAXGNIUMKQHC22IQV5W:thisuser-Isengard',
                    MessageDeduplicationId:
                        '9c4ce74f36bae4efafee3baec69f14d8b8e1cde0131b890e9da32067c35b8de9',
                    ApproximateFirstReceiveTimestamp: '1631849884497',
                },
                body: JSON.stringify({
                    'detail-type': 'Security Hub Finding',
                    account: '111122223333',
                    detail: {
                        findings: [
                            {
                                AwsAccountId: '111122223333',
                                CreatedAt: new Date().toISOString(),
                                Description: 'Test finding',
                                GeneratorId: '1234',
                                Id: '1234',
                                ProductArn: productArn ?? 'Security Hub',
                                Resources: [
                                    {
                                        Id: 'resource-id',
                                        Type: 'resource-type',
                                        Tags: { key: 'value', AGSReleaseId: '12345' },
                                    },
                                ],
                                SchemaVersion: '1.0',
                                Severity: { Label: 'CRITICAL', Original: '100' },
                                Title: 'test finding',
                                Types: ['a finding type'],
                                UpdatedAt: new Date().toISOString(),
                            },
                        ],
                    },
                    id: 'finding-id',
                    region: 'ap-southeast-2',
                    resources: ['sec hub'],
                    source: 'aws.securityhub',
                    time: new Date().toISOString(),
                    version: '1',
                }),
                messageAttributes: {},
                md5OfBody: 'bb748b2498bf2ab91aca68cfe4cfb877',
                eventSource: 'aws:sqs',
                eventSourceARN:
                    'arn:aws:sqs:ap-southeast-2:111122223333:AGSSecurityHubEvidenceCollector-EvidenceCollectorRateLimitQueue.fifo',
                awsRegion: 'ap-southeast-2',
            },
        ],
    };
}
