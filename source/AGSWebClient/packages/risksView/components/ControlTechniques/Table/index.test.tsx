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
import { UserGroup } from '@ags/webclient-core/types';
import * as appContext from '@ags/webclient-core/containers/AppContext';
import { ControlTechniqueSummary } from '@ags/webclient-risks-core/types';

import ControlTechniqueTable from '.';
jest.mock('@ags/webclient-core/containers/AppContext');

const controlTechniques: ControlTechniqueSummary[] = [
    {
        id: 'co-1',
        name: 'Control Technique 1',
        description: 'Description Control Technique 1',
        controlType: 'DETECTIVE',
    },
    {
        id: 'co-2',
        name: 'Control Technique 2',
        description: 'Description Control Technique 2',
        controlType: 'DETECTIVE',
    },
    {
        id: 'co-3',
        name: 'Control Technique 3',
        description: 'Description Control Technique 3',
        controlType: 'DETECTIVE',
    },
];

describe('ControlTechniqueTable', () => {
    test('render', async () => {
        const mockOnDelete = jest.fn();

        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        const { getByText, getAllByRole } = render(
            <BrowserRouter>
                <ControlTechniqueTable
                    controlTechniques={controlTechniques}
                    disableRowSelect={false}
                    disableToolbar={false}
                    disableCreate={false}
                    disableDelete={false}
                    onDeleteControlTechnique={mockOnDelete}
                />
            </BrowserRouter>
        );

        expect(getByText('Control Techniques (3)')).toBeInTheDocument();
        expect(getByText('Control Technique 1')).toBeInTheDocument();
        expect(getByText('Control Technique 2')).toBeInTheDocument();
        expect(getByText('Control Technique 3')).toBeInTheDocument();

        // buttons
        expect(getByText('Delete').parentElement).toBeDisabled();
        expect(getByText('Update').parentElement).toBeDisabled();
        expect(getByText('Add new Control Technique').parentElement).toBeEnabled();

        // three radio buttons for selection
        expect(getAllByRole('radio').length).toBe(3);

        // select a control Technique
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
                description: 'Description Control Technique 2',
                id: 'co-2',
                name: 'Control Technique 2',
                controlType: 'DETECTIVE',
            },
        ]);
    });
});
