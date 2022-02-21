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
const mockFilterFindings = jest.fn();
const mockGetAgsRelatedFindgins = jest.fn();
const mockRecordEvidence = jest.fn();
const mockStoreFinding = jest.fn();
const mockGetResourceTags = jest.fn();

jest.mock('../../src/SecurityHubFindingHelper', () => {
    return {
        filterFindingsWithAcceptedSuffixes: mockFilterFindings,
        getAgsRelatedFindings: mockGetAgsRelatedFindgins,
    };
});

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
        getResourcesTags: mockGetResourceTags,
    };
});

import { SecurityHubEventProcessor } from 'src/SecurityHubEventProcessor';
import { getParameterResponse } from 'test/__mocks__/@aws-sdk/client-ssm';

const sampleMessage = {
    detail: {
        findings: [
            {
                AwsAccountId: '1234',
                CreatedAt: new Date().toISOString(),
                Description: 'Test finding',
                GeneratorId: '1234',
                Id: '1234',
                ProductArn: 'Security Hub',
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
};

describe('Prepare findings as evidence tests', () => {
    beforeEach(() => {
        mockFilterFindings.mockClear();
        mockGetAgsRelatedFindgins.mockClear();
        mockGetResourceTags.mockClear();
        mockRecordEvidence.mockClear();
        mockStoreFinding.mockClear();
        getParameterResponse.mockResolvedValueOnce({ Parameter: { Value: 'test' } });
    });

    const processor = new SecurityHubEventProcessor();

    test('do nothing if message contains no matched findings', async () => {
        mockFilterFindings.mockReturnValueOnce([]);

        await processor.processEvent(sampleMessage);

        expect(mockStoreFinding).not.toHaveBeenCalled();
        expect(mockRecordEvidence).not.toHaveBeenCalled();
    });
});
