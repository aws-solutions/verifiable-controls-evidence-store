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
import { buildEvidenceSearchQuery } from 'src/data/DslQueryBuilder';

describe('DslQueryBuilder tests', () => {
    test('can build query', () => {
        const input = {
            targetIds: [
                'Super-naughty-app',
                'TTPs/Impact:EC2-BitcoinDomainRequest.Reputation',
                'arn:aws:s3:::my-very-naughty-bucket',
            ],
            providerIds: ['12345', '678'],
            fromTimestamp: '2021-09-23T06:32:14.527Z',
            providerId: 'security-hub-evidence-collector',
            schemaId: 'sec-hub-evidence-1.0',
            content: 'Domain',
        };

        expect(
            buildEvidenceSearchQuery(
                10,
                0,
                input.targetIds,
                input.providerId,
                input.providerIds,
                input.schemaId,
                input.content,
                input.fromTimestamp
            )
        ).toEqual({
            query: {
                bool: {
                    filter: {
                        bool: {
                            must: [
                                {
                                    bool: {
                                        must: {
                                            bool: {
                                                should: [
                                                    {
                                                        term: {
                                                            'targetId.keyword':
                                                                'Super-naughty-app',
                                                        },
                                                    },
                                                    {
                                                        term: {
                                                            'targetId.keyword':
                                                                'TTPs/Impact:EC2-BitcoinDomainRequest.Reputation',
                                                        },
                                                    },
                                                    {
                                                        term: {
                                                            'targetId.keyword':
                                                                'arn:aws:s3:::my-very-naughty-bucket',
                                                        },
                                                    },
                                                    {
                                                        terms: {
                                                            'additionalTargetIds.keyword':
                                                                [
                                                                    'Super-naughty-app',
                                                                    'TTPs/Impact:EC2-BitcoinDomainRequest.Reputation',
                                                                    'arn:aws:s3:::my-very-naughty-bucket',
                                                                ],
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                                {
                                    bool: {
                                        must: {
                                            bool: {
                                                should: [
                                                    {
                                                        term: {
                                                            'providerId.keyword': '12345',
                                                        },
                                                    },
                                                    {
                                                        term: {
                                                            'providerId.keyword': '678',
                                                        },
                                                    },
                                                    {
                                                        term: {
                                                            'content.source.keyword':
                                                                '12345',
                                                        },
                                                    },
                                                    {
                                                        term: {
                                                            'content.source.keyword':
                                                                '678',
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                                {
                                    range: {
                                        createdTimestamp: {
                                            from: '2021-09-23T06:32:14.527Z',
                                            include_lower: true,
                                        },
                                    },
                                },
                                {
                                    term: {
                                        'providerId.keyword':
                                            'security-hub-evidence-collector',
                                    },
                                },
                                { term: { 'schemaId.keyword': 'sec-hub-evidence-1.0' } },
                                { wildcard: { contentString: '*Domain*' } },
                            ],
                        },
                    },
                },
            },
            size: 10,
            sort: [
                {
                    createdTimestamp: 'desc',
                },
            ],
        });
    });
});
