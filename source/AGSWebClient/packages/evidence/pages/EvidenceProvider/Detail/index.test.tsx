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
import { useAgsQuery } from '@ags/webclient-core/queries';
import { QueryType } from '@ags/webclient-evidence-core/queries';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';
import { render, screen } from '@testing-library/react';
import { when } from 'jest-when';
import EvidenceProviderView from '.';
import { BrowserRouter } from 'react-router-dom';
import * as appContext from '@ags/webclient-core/containers/AppContext';
import { UserGroup } from '@ags/webclient-core/types';

const mockUseAgsQuery = useAgsQuery as jest.Mock<any>;

jest.mock('@ags/webclient-core/containers/AppContext');
jest.mock('@ags/webclient-core/queries');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ providerId: '12345' }),
}));
jest.mock('aws-northstar/layouts/AppLayout');

const providerData: EvidenceProvider = {
    createdTimestamp: new Date().toISOString(),
    description: 'my provider',
    enabled: true,
    name: 'my test provider',
    providerId: '12345',
    schemas: [{ schemaId: 'my-schema', content: JSON.stringify({ succeed: true }) }],
};

describe('Provider details page', () => {
    beforeAll(() => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));
        const mockUseAgsQueryFn = jest.fn();

        when(mockUseAgsQueryFn)
            .calledWith(QueryType.GET_EVIDENCE_PROVIDER, '12345')
            .mockReturnValue({
                isLoading: false,
                isError: false,
                error: undefined,
                data: providerData,
            });

        mockUseAgsQuery.mockImplementation(mockUseAgsQueryFn);
    });

    test('render page', () => {
        render(
            <BrowserRouter>
                <EvidenceProviderView />
            </BrowserRouter>
        );

        expect(
            screen.getByText('Evidence Provider Details - my test provider')
        ).toBeInTheDocument();
        expect(screen.getByText('my-schema')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('my provider')).toBeInTheDocument();
    });
});
