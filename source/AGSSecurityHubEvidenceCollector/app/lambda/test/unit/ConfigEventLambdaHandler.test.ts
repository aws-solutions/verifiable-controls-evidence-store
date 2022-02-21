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
import { lambdaHandler } from 'src/App';
import { httpPostFn } from 'test/__mocks__/@apjsb-serverless-lib/apjsb-aws-httpclient';
import { batchGetResourceResponse } from 'test/__mocks__/@aws-sdk/client-config-service';
import { getResourcesResponse } from 'test/__mocks__/@aws-sdk/client-resource-groups-tagging-api';
import { putObjectResponse } from 'test/__mocks__/@aws-sdk/client-s3';
import { getSecretsResponse } from 'test/__mocks__/@aws-sdk/client-secrets-manager';
import { getParameterResponse } from 'test/__mocks__/@aws-sdk/client-ssm';
import { assumeRoleResponse } from 'test/__mocks__/@aws-sdk/client-sts';
import { ConfigEventProcessor } from 'src/ConfigEventProcessor';
import { SSMParameterClient } from 'src/clients/SSMParameterClient';
import { SecretsManagerClient } from 'src/clients/SecretManagerClient';

describe('Lambda handler tests with config events', () => {
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
        ConfigEventProcessor._instance = undefined;

        assumeRoleResponse.mockResolvedValue({
            Credentials: {
                SecretAccessKey: 'secret',
                AccessKeyId: 'access',
                Expiration: 'expr',
                SessionToken: 'token',
            },
        });
    });

    test('can record new evidences', async () => {
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockResolvedValueOnce({ statusCode: 201 });
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'bucket' },
        });
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'http://localhost' },
        });
        batchGetResourceResponse.mockResolvedValueOnce({
            baseConfigurationItems: [
                {
                    arn: 'arn:aws:lambda:ap-southeast-2:12345678:function:my-function',
                },
            ],
        });
        getResourcesResponse.mockResolvedValueOnce({
            ResourceTagMappingList: [
                {
                    ResourceARN:
                        'arn:aws:lambda:ap-southeast-2:12345678:function:my-function',
                    Tags: [{ Key: 'AGSAppName', Value: 'my-app' }],
                },
            ],
        });

        await lambdaHandler(generateConfigEvent(), {});

        expect(getSecretsResponse).toHaveBeenCalledTimes(1);
        expect(httpPostFn).toHaveBeenCalledTimes(1);
        expect(getParameterResponse).toHaveBeenCalledTimes(2);
        expect(putObjectResponse).toHaveBeenCalledTimes(1);
    });

    test('does nothing when response to record new evidences is empty', async () => {
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockResolvedValueOnce({});
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'bucket' },
        });
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'http://localhost' },
        });
        batchGetResourceResponse.mockResolvedValueOnce({
            baseConfigurationItems: [
                { arn: 'arn:aws:lambda:ap-southeast-2:12345678:function:my-function' },
            ],
        });
        getResourcesResponse.mockResolvedValueOnce({
            ResourceTagMappingList: [
                {
                    ResourceARN:
                        'arn:aws:lambda:ap-southeast-2:12345678:function:my-function',
                    Tags: [{ Key: 'AGSAppName', Value: 'my-app' }],
                },
            ],
        });

        await lambdaHandler(generateConfigEvent(), {});

        expect(getSecretsResponse).toHaveBeenCalledTimes(1);
        expect(httpPostFn).toHaveBeenCalledTimes(1);
        expect(getParameterResponse).toHaveBeenCalledTimes(2);
        expect(putObjectResponse).toHaveBeenCalledTimes(1);
    });

    test('throws error when failing to record new evidences', async () => {
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockRejectedValueOnce({ statusCode: 404 });
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'http://localhost' },
        });
        batchGetResourceResponse.mockResolvedValueOnce({
            baseConfigurationItems: [
                { arn: 'arn:aws:lambda:ap-southeast-2:12345678:function:my-function' },
            ],
        });
        getResourcesResponse.mockResolvedValueOnce({
            ResourceTagMappingList: [
                {
                    ResourceARN:
                        'arn:aws:lambda:ap-southeast-2:12345678:function:my-function',
                    Tags: [{ Key: 'AGSAppName', Value: 'my-app' }],
                },
            ],
        });

        const task = () => lambdaHandler(generateConfigEvent(), {});

        await expect(task).rejects.toThrowError();
    });

    test('throws error when evidence store api endpoint name is undefined', async () => {
        delete process.env.EVIDENCE_STORE_API_SSM;
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockResolvedValueOnce({ statusCode: 201 });
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'http://localhost' },
        });
        const task = () => lambdaHandler(generateConfigEvent(), {});

        await expect(task).rejects.toThrowError();
    });

    test('throws error when evidence store api secret name is undefined', async () => {
        delete process.env.API_SECRET_NAME;
        getSecretsResponse.mockResolvedValueOnce({ SecretString: 'api-key' });
        httpPostFn.mockResolvedValueOnce({ statusCode: 201 });
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'http://localhost' },
        });

        const task = () => lambdaHandler(generateConfigEvent(), {});

        await expect(task).rejects.toThrowError();
    });
});

function generateConfigEvent(): SQSEvent {
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
                    'detail-type': 'Config Rules Compliance Change',
                    account: '1234',
                    detail: {
                        resourceId:
                            'AGSOpsGovService-AGSOpsGovServiceopsGovListenerLam-Om0IBWoMkmwc',
                        awsRegion: 'ap-southeast-2',
                        awsAccountId: '116652378265',
                        configRuleName: 'Canary-Rule',
                        recordVersion: '1.0',
                        configRuleARN:
                            'arn:aws:config:ap-southeast-2:${awsaccount}:config-rule/config-rule-canary',
                        messageType: 'ComplianceChangeNotification',
                        newEvaluationResult: {
                            evaluationResultIdentifier: {
                                evaluationResultQualifier: {
                                    configRuleName: 'Canary-Rule',
                                    resourceType: 'AWS::Lambda::Function',
                                    resourceId:
                                        'arn:aws:cloudformation:ap-southeast-2:${awsaccount}:stack/runtimeStack',
                                },
                                orderingTimestamp: '2021-07-12T08:24:29.049Z',
                            },
                            complianceType: 'NON_COMPLIANT',
                            resultRecordedTime: '2021-07-12T08:24:38.209Z',
                            configRuleInvokedTime: '2021-07-12T08:24:38.038Z',
                        },
                        notificationCreationTime: '2021-07-12T08:24:39.034Z',
                        resourceType: 'AWS::Lambda::Function',
                    },
                    id: 'finding-id',
                    region: 'ap-southeast-2',
                    resources: ['sec hub'],
                    source: 'aws.config',
                    time: new Date().toISOString(),
                    version: '1',
                }),
                messageAttributes: {},
                md5OfBody: 'bb748b2498bf2ab91aca68cfe4cfb877',
                eventSource: 'aws:sqs',
                eventSourceARN:
                    'arn:aws:sqs:ap-southeast-2:12312312:AGSSecurityHubEvidenceCollector-EvidenceCollectorRateLimitQueue.fifo',
                awsRegion: 'ap-southeast-2',
            },
        ],
    };
}
