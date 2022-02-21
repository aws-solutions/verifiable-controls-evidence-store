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
import { SchemaDetails } from '@ags/webclient-evidence-core/types';
import { render, screen } from '@testing-library/react';
import { when } from 'jest-when';
import { BrowserRouter } from 'react-router-dom';
import EvidenceProviderSchemaView from '.';

const mockUseAgsQuery = useAgsQuery as jest.Mock<any>;

jest.mock('@ags/webclient-core/containers/AppContext');
jest.mock('@ags/webclient-core/queries');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ providerId: '12345', schemaId: 'schema1' }),
}));
jest.mock('aws-northstar/layouts/AppLayout');

const schemaData: SchemaDetails = {
    schemaId: 'schema1',
    createdTimestamp: new Date().toISOString(),
    providerId: '12345',
    content: { succeed: true },
};

describe('Schema details page', () => {
    beforeAll(() => {
        const mockUseAgsQueryFn = jest.fn();

        when(mockUseAgsQueryFn)
            .calledWith(QueryType.GET_SCHEMA_DETAILS, '12345', 'schema1')
            .mockReturnValue({
                isLoading: false,
                isError: false,
                error: undefined,
                data: schemaData,
            });

        mockUseAgsQuery.mockImplementation(mockUseAgsQueryFn);
    });

    test('render page', () => {
        render(
            <BrowserRouter>
                <EvidenceProviderSchemaView />
            </BrowserRouter>
        );

        expect(
            screen.getByText('Schema Details for Evidence Provider - 12345')
        ).toBeInTheDocument();
        expect(screen.getAllByText('schema1').length).toBeGreaterThan(0);
        expect(screen.getByText('12345')).toBeInTheDocument();
        expect(screen.getByText('succeed')).toBeInTheDocument();
    });
});
