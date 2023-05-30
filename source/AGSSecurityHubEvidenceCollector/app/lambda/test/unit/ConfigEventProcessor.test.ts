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
const mockRecordEvidence = jest.fn();
const mockStoreFinding = jest.fn();
const mockGetTags = jest.fn();
const mockGetArn = jest.fn();

jest.mock('../../src/clients/EvidenceStoreClient', () => {
    return { recordEvidence: mockRecordEvidence };
});

jest.mock('../../src/clients/S3Client', () => {
    return {
        storeFinding: mockStoreFinding,
    };
});

jest.mock('../../src/clients/TagClient', () => {
    return {
        getTags: mockGetTags,
    };
});

jest.mock('../../src/clients/ConfigClient', () => {
    return {
        getArn: mockGetArn,
    };
});

import { ConfigEventProcessor } from 'src/ConfigEventProcessor';

describe('config event processor tests', () => {
    const processor = ConfigEventProcessor.getInstance();

    beforeEach(() => {
        mockGetArn.mockClear();
        mockGetTags.mockClear();
        mockRecordEvidence.mockClear();
        mockStoreFinding.mockClear();
    });

    test('can process config finding', async () => {
        mockGetArn.mockResolvedValueOnce(
            'arn:aws:lambda:ap-southeast-2:111122223333:function:my-function'
        );
        mockGetTags.mockResolvedValueOnce([
            { Tags: [{ Key: 'AGSAppName', Value: '1234' }] },
        ]);
        mockStoreFinding.mockResolvedValueOnce('https://localhost/findinglocation');
        mockRecordEvidence.mockResolvedValueOnce([true]);

        await processor.processEvent(sampleMessage);

        expect(mockGetArn).toHaveBeenCalledTimes(1);
        expect(mockGetTags).toHaveBeenCalledTimes(1);
        expect(mockStoreFinding).toHaveBeenCalledTimes(1);
        expect(mockRecordEvidence).toHaveBeenCalledTimes(1);
    });

    test('do nothing if invalid resource arn', async () => {
        mockGetArn.mockResolvedValueOnce('1234');

        await processor.processEvent(sampleMessage);

        expect(mockGetArn).toHaveBeenCalledTimes(1);
        expect(mockGetTags).not.toHaveBeenCalled();
        expect(mockStoreFinding).not.toHaveBeenCalled();
        expect(mockRecordEvidence).not.toHaveBeenCalled();
    });
});

const sampleMessage = {
    detail: {
        resourceId: 'AGSOpsGovService-AGSOpsGovServiceopsGovListenerLam-Om0IBWoMkmwc',
        awsRegion: 'ap-southeast-2',
        awsAccountId: '111122223333',
        configRuleName: 'Canary-Rule',
        recordVersion: '1.0',
        configRuleARN:
            'arn:aws:config:ap-southeast-2:111122223333:config-rule/config-rule-canary',
        messageType: 'ComplianceChangeNotification',
        newEvaluationResult: {
            evaluationResultIdentifier: {
                evaluationResultQualifier: {
                    configRuleName: 'Canary-Rule',
                    resourceType: 'AWS::Lambda::Function',
                    resourceId:
                        'arn:aws:cloudformation:ap-southeast-2:111122223333:stack/runtimeStack',
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
};
