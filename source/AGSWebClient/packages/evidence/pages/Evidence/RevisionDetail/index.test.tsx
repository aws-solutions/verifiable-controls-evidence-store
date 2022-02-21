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
import {
    useAgsListQuery,
    useAgsMutation,
    useAgsQuery,
} from '@ags/webclient-core/queries';
import { QueryType } from '@ags/webclient-evidence-core/queries';
import { Evidence } from '@ags/webclient-evidence-core/types';
import { when } from 'jest-when';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EvidenceDetailView from '../Detail';

const mockAddNotificationFn = jest.fn();
const mockMutateFn = jest.fn();

jest.mock('@ags/webclient-core/containers/AppContext');
jest.mock('@ags/webclient-core/queries');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ evidenceId: '1234', revisionId: '0' }),
}));
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({ addNotification: mockAddNotificationFn }),
}));

const mockUseAgsQuery = useAgsQuery as jest.Mock<any>;
const mockUseAgsListQuery = useAgsListQuery as jest.Mock<any>;
const mockUseAgsMutation = useAgsMutation as jest.Mock<any>;

const evidenceData: Evidence = {
    evidenceId: '1234',
    createdTimestamp: new Date().toISOString(),
    providerId: 'provider',
    providerName: 'my-provider',
    schemaId: 'schema',
    targetId: 'my-target',
    content: { succeed: true },
};

describe('Evidence details page', () => {
    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
    });

    beforeAll(() => {
        const mockUseAgsQueryfn = jest.fn();

        when(mockUseAgsQueryfn)
            .calledWith(QueryType.GET_REVISION, '1234', '0')
            .mockReturnValue({
                isLoading: false,
                data: evidenceData,
                isError: false,
                error: null,
            });

        when(mockUseAgsQueryfn)
            .calledWith(QueryType.LIST_REVISIONS, '1234')
            .mockReturnValue({
                data: undefined,
                isLoading: false,
            });

        when(mockUseAgsQueryfn)
            .calledWith(QueryType.GET_REVISION_VERIFICATION_STATUS, '1234', '0')
            .mockReturnValue({
                isLoading: false,
                data: { verificationStatus: 'Verified' },
            });

        mockUseAgsQuery.mockImplementation(mockUseAgsQueryfn);

        mockUseAgsListQuery.mockImplementation(mockUseAgsQueryfn);

        mockUseAgsMutation.mockImplementation((_mutationType: string, _?: any) => {
            return {
                isLoading: false,
                mutate: mockMutateFn,
            };
        });
    });

    test('render page', () => {
        render(
            <BrowserRouter>
                <EvidenceDetailView />
            </BrowserRouter>
        );

        expect(screen.getByText('my-provider')).toBeInTheDocument();
        expect(screen.getByText('my-target')).toBeInTheDocument();
        expect(
            screen.getByText('Evidence Details - 1234 - Revision 0')
        ).toBeInTheDocument();
        expect(screen.getByText('succeed')).toBeInTheDocument();
    });
});
