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
import { act, fireEvent, render } from '@testing-library/react';

import { BrowserRouter } from 'react-router-dom';
import EvidenceSearchForm from '.';

describe('search evidence form tests', () => {
    test('render create', () => {
        const mockOnSearch = jest.fn();

        const { getByText, getByLabelText, getAllByTestId } = render(
            <BrowserRouter>
                <EvidenceSearchForm
                    onSearch={mockOnSearch}
                    evidenceProviders={[
                        {
                            name: 'test',
                            providerId: 'authority',
                            createdTimestamp: new Date().toISOString(),
                            enabled: true,
                            description: 'test',
                            schemas: [],
                        },
                    ]}
                    isSubmitting={false}
                ></EvidenceSearchForm>
            </BrowserRouter>
        );

        expect(getByText('Evidence provider')).toBeInTheDocument();
        expect(getByText('Evidence schema id')).toBeInTheDocument();
        expect(getByText('Evidence content')).toBeInTheDocument();
        expect(getByText('Evidence target ids')).toBeInTheDocument();
        expect(getByText('Start date')).toBeInTheDocument();
        expect(getByText('End date')).toBeInTheDocument();
        expect(getAllByTestId('select').length).toBe(1);

        act(() => {
            fireEvent.change(getAllByTestId('select')[0].children[1], {
                target: { value: 'authority' },
            });
            fireEvent.change(getByLabelText('Evidence schema id'), {
                target: { value: 'schema' },
            });
            fireEvent.change(getByLabelText('Evidence content'), {
                target: { value: 'content' },
            });
            fireEvent.click(getByText('Search'));
        });
        expect(mockOnSearch).toBeCalledWith({
            searchForm: {
                providerId: 'authority',
                schemaId: 'schema',
                content: 'content',
            },
        });
    });
});
