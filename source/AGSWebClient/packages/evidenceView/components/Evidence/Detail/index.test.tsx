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
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Evidence } from '@ags/webclient-evidence-core/types';
import EvidenceDetail from '.';

const model: Evidence = {
    evidenceId: 'evidenceId',
    providerId: 'providerId',
    providerName: 'test authority',
    createdTimestamp: '2021-10-11T12:34:56Z',
    schemaId: 'schema-v1',
    targetId: 'my-primary-target',
    additionalTargetIds: ['my-secondary-target'],
    content: {
        succeed: true,
    },
};

describe('Evidence detail view tests', () => {
    test('render with evidence', () => {
        const { getByText } = render(
            <BrowserRouter>
                <EvidenceDetail
                    evidence={model}
                    showRevisions={true}
                    revisions={[{ createdTimestamp: new Date() } as unknown as Evidence]}
                ></EvidenceDetail>
            </BrowserRouter>
        );

        expect(getByText('Evidence Details - evidenceId')).toBeInTheDocument();
        expect(getByText('test authority')).toBeInTheDocument();
        expect(getByText('my-primary-target')).toBeInTheDocument();
        expect(getByText('my-secondary-target')).toBeInTheDocument();
        expect(getByText('succeed')).toBeInTheDocument();
        expect(() => getByText('Evidence Metadata')).toThrow();
        expect(getByText('Revisions - (1)')).toBeInTheDocument();
    });

    test('show metadata tab', () => {
        const { getByText } = render(
            <BrowserRouter>
                <EvidenceDetail
                    evidence={{ ...model, metadata: { test: 'true' } }}
                    showRevisions={true}
                ></EvidenceDetail>
            </BrowserRouter>
        );
        expect(getByText('Metadata')).toBeInTheDocument();
    });

    test('show attachment tab', () => {
        const { getByText } = render(
            <BrowserRouter>
                <EvidenceDetail
                    evidence={{
                        ...model,
                        metadata: { test: 'true' },
                        attachments: [
                            {
                                attachmentId: '1234',
                                objectKey: 'test/my-object',
                            },
                        ],
                    }}
                    showRevisions={true}
                ></EvidenceDetail>
            </BrowserRouter>
        );
        expect(getByText('Attachments - (1)')).toBeInTheDocument();
    });

    test('can hide revisions tab', () => {
        const { getByText } = render(
            <BrowserRouter>
                <EvidenceDetail
                    evidence={{
                        ...model,
                        metadata: { test: 'true' },
                    }}
                    showRevisions={false}
                ></EvidenceDetail>
            </BrowserRouter>
        );
        expect(() => getByText('Revisions')).toThrow();
    });

    test('show revision id in header', () => {
        const { getByText } = render(
            <BrowserRouter>
                <EvidenceDetail
                    evidence={{ ...model }}
                    revisionId="1"
                    showRevisions={false}
                ></EvidenceDetail>
            </BrowserRouter>
        );
        expect(
            getByText('Evidence Details - evidenceId - Revision 1')
        ).toBeInTheDocument();
    });
});
