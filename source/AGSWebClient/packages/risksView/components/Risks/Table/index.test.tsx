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
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RiskSummary } from '@ags/webclient-risks-core/types';
import { UserGroup } from '@ags/webclient-core/types';
import RiskTable from '.';
import * as appContext from '@ags/webclient-core/containers/AppContext';

jest.mock('@ags/webclient-core/containers/AppContext');

const risks: RiskSummary[] = [
    {
        id: 'r-1',
        name: 'Risk 1',
        category: 'GENERAL',
        description: 'Description Risk 1',
    },
    {
        id: 'r-2',
        name: 'Risk 2',
        category: 'GENERAL',
        description: 'Description Risk 2',
    },
    {
        id: 'r-3',
        name: 'Risk 3',
        category: 'GENERAL',
        description: 'Description Risk 3',
    },
];

describe('RiskTable', () => {
    test('render', async () => {
        const mockOnDelete = jest.fn();

        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        const { getByText, getAllByRole } = render(
            <BrowserRouter>
                <RiskTable
                    risks={risks}
                    disableRowSelect={false}
                    disableToolbar={false}
                    disableCreate={false}
                    disableDelete={false}
                    onDeleteRisk={mockOnDelete}
                />
            </BrowserRouter>
        );

        expect(getByText('Risks (3)')).toBeInTheDocument();
        expect(getByText('Risk 1')).toBeInTheDocument();
        expect(getByText('Risk 2')).toBeInTheDocument();
        expect(getByText('Risk 3')).toBeInTheDocument();

        // buttons
        expect(getByText('Delete').parentElement).toBeDisabled();
        expect(getByText('Update').parentElement).toBeDisabled();
        expect(getByText('Add new Risk').parentElement).toBeEnabled();

        // three radio buttons for selection
        expect(getAllByRole('radio').length).toBe(3);

        // select a control objective
        await act(async () => {
            const radioButton = getAllByRole('radio')[1];
            radioButton.click();
        });

        await waitFor(() => {
            expect(getByText('Delete').parentElement).toBeEnabled();
            expect(getByText('Update').parentElement).toBeEnabled();
        });

        act(() => {
            fireEvent.click(getByText('Delete'));
        });
        expect(mockOnDelete).toBeCalledWith([
            {
                description: 'Description Risk 2',
                id: 'r-2',
                name: 'Risk 2',
                category: 'GENERAL',
            },
        ]);
    });
});
