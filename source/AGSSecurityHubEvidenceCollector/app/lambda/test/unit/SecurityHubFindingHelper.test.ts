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
import { EventBridgeEvent } from 'aws-lambda';
import { SecurityHubFinding } from 'src/SecurityHubEvent';
import {
    filterFindingsWithAcceptedSuffixes,
    getAgsRelatedFindings,
} from 'src/SecurityHubFindingHelper';

describe('SecurityHubFindingHelper tests', () => {
    const findingSourceProductArns = ['macie$', 'guardduty$'];

    test('filterFindingsWithAcceptedSuffixes can handle an empty event', () => {
        filterFindingsWithAcceptedSuffixes(
            {} as EventBridgeEvent<any, any>,
            findingSourceProductArns
        );
    });

    test('filterFindingsWithAcceptedSuffixes can handle an event with no findings', () => {
        const event = {
            detail: {},
        };
        filterFindingsWithAcceptedSuffixes(
            event as EventBridgeEvent<any, any>,
            findingSourceProductArns
        );
    });

    test('filterFindingsWithAcceptedSuffixes can handle an event with empty findings', () => {
        const event = {
            detail: {
                findings: [{}],
            },
        };
        filterFindingsWithAcceptedSuffixes(
            event as EventBridgeEvent<any, any>,
            findingSourceProductArns
        );
    });

    test('filterFindingsWithAcceptedSuffixes can handle an event with findings and no ProductArn', () => {
        const event = {
            detail: {
                findings: [
                    {
                        Resources: [{ Id: 'Id1' }, { Id: 'Id2' }],
                    },
                    {
                        Resources: [{ Id: 'Id5' }, { Id: 'Id4' }, { Id: 'Id77' }],
                    },
                ],
            },
        };
        const res = filterFindingsWithAcceptedSuffixes(
            event as EventBridgeEvent<any, any>,
            findingSourceProductArns
        );
        expect(res).toStrictEqual([]);
    });

    test('filterFindingsWithAcceptedSuffixes can handle no findings that match', () => {
        const event = {
            detail: {
                findings: [
                    {
                        ProductArn:
                            'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/beer-service',
                        Resources: [{ Id: 'Id1' }, { Id: 'Id2' }],
                    },
                    {
                        ProductArn:
                            'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/infinidash',
                        Resources: [{ Id: 'Id5' }, { Id: 'Id4' }, { Id: 'Id77' }],
                    },
                ],
            },
        };
        const res = filterFindingsWithAcceptedSuffixes(
            event as EventBridgeEvent<any, any>,
            findingSourceProductArns
        );
        expect(res).toStrictEqual([]);
    });

    test('filterFindingsWithAcceptedSuffixes can handle no findings that match due to different product arns source list', () => {
        const event = {
            detail: {
                findings: [
                    {
                        ProductArn:
                            'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/macie',
                        Resources: [{ Id: 'Id1' }, { Id: 'Id2' }],
                    },
                    {
                        ProductArn:
                            'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/guardduty',
                        Resources: [{ Id: 'Id5' }, { Id: 'Id4' }, { Id: 'Id77' }],
                    },
                ],
            },
        };
        const res = filterFindingsWithAcceptedSuffixes(
            event as EventBridgeEvent<any, any>,
            ['beer-service$', 'infinidash$']
        );
        expect(res).toStrictEqual([]);
    });

    test('filterFindingsWithAcceptedSuffixes can handle one finding that matches', () => {
        const event = {
            detail: {
                findings: [
                    {
                        ProductArn:
                            'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/beer-service',
                        Resources: [{ Id: 'Id1' }, { Id: 'Id2' }, { Id: 'Id3' }],
                    },
                    {
                        ProductArn:
                            'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/macie',
                        Resources: [{ Id: 'Id5' }, { Id: 'Id4' }, { Id: 'Id77' }],
                    },
                ],
            },
        };
        const res = filterFindingsWithAcceptedSuffixes(
            event as EventBridgeEvent<any, any>,
            findingSourceProductArns
        );
        const expectedFindings = [
            {
                ProductArn:
                    'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/macie',
                Resources: [{ Id: 'Id5' }, { Id: 'Id4' }, { Id: 'Id77' }],
            },
        ];
        expect(res).toStrictEqual(expectedFindings);
    });

    test('filterFindingsWithAcceptedSuffixes can handle multiple findings that match', () => {
        const event = {
            detail: {
                findings: [
                    {
                        ProductArn:
                            'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/beer-service',
                        Resources: [{ Id: 'Id1' }, { Id: 'Id2' }, { Id: 'Id3' }],
                    },
                    {
                        ProductArn:
                            'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/macie',
                        Resources: [{ Id: 'Id55' }, { Id: 'Id44' }, { Id: 'Id77' }],
                    },
                    {
                        ProductArn:
                            'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/guardduty',
                        Resources: [{ Id: 'Id5' }, { Id: 'Id4' }, { Id: 'Id7' }],
                    },
                ],
            },
        };
        const res = filterFindingsWithAcceptedSuffixes(
            event as EventBridgeEvent<any, any>,
            findingSourceProductArns
        );
        const expectedFindings = [
            {
                ProductArn:
                    'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/macie',
                Resources: [{ Id: 'Id55' }, { Id: 'Id44' }, { Id: 'Id77' }],
            },
            {
                ProductArn:
                    'arn:aws:securityhub:ap-southeast-2:1234:product-subscription/aws/guardduty',
                Resources: [{ Id: 'Id5' }, { Id: 'Id4' }, { Id: 'Id7' }],
            },
        ];
        expect(res).toStrictEqual(expectedFindings);
    });

    test('getAgsFindings can filter out findings with ags tags', () => {
        const input: SecurityHubFinding[] = [
            {
                Resources: [
                    {
                        Tags: {
                            AGSReleaseId: '12345',
                        },
                    },
                    {
                        Tags: {
                            anotherTag: '12345',
                        },
                    },
                ],
            } as unknown as SecurityHubFinding,
            {
                Resources: [
                    {
                        Tags: {
                            anotherTag: '12345',
                        },
                    },
                ],
            } as unknown as SecurityHubFinding,
        ];

        const agsFindings = getAgsRelatedFindings(input);

        expect(agsFindings.length).toBe(1);
    });
});
