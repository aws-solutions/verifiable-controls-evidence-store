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
import { ApplicationSummary } from '@ags/webclient-application-release-core/types';
import * as appContext from '@ags/webclient-core/containers/AppContext';
import ApplicationTable from '.';

jest.mock('@ags/webclient-core/containers/AppContext');

const applications: ApplicationSummary[] = [
    {
        name: 'Application 1',
        description: 'Description Application 1',
        applicationOwner: 'owner1',
        estateId: 'estate1',
        createTime: '2021-08-17T14:15:47.781Z',
        lastUpdateTime: '2021-08-17T14:15:47.781Z',
        pipelineProvisionStatus: 'ACTIVE',
    },
    {
        name: 'Application 2',
        description: 'Description Application 2',
        applicationOwner: 'owner2',
        estateId: 'estate2',
        createTime: '2021-08-17T14:15:47.781Z',
        lastUpdateTime: '2021-08-17T14:15:47.781Z',
        pipelineProvisionStatus: 'ACTIVE',
    },
    {
        name: 'Application 3',
        description: 'Description Application 3',
        applicationOwner: 'owner3',
        estateId: 'estate3',
        createTime: '2021-08-17T14:15:47.781Z',
        lastUpdateTime: '2021-08-17T14:15:47.781Z',
        pipelineProvisionStatus: 'ACTIVE',
    },
];

describe('ApplicationTable', () => {
    test('render', async () => {
        const mockOnDelete = jest.fn();

        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        const { getByText, getAllByRole } = render(
            <BrowserRouter>
                <ApplicationTable
                    applications={applications}
                    disableRowSelect={false}
                    disableToolbar={false}
                    disableCreate={false}
                    disableDelete={false}
                    OnDeleteApplication={mockOnDelete}
                />
            </BrowserRouter>
        );

        expect(getByText('Applications (3)')).toBeInTheDocument();
        expect(getByText('Application 1')).toBeInTheDocument();
        expect(getByText('Application 2')).toBeInTheDocument();
        expect(getByText('Application 3')).toBeInTheDocument();

        // buttons
        expect(getByText('Delete').parentElement).toBeDisabled();
        expect(getByText('Update').parentElement).toBeDisabled();
        expect(getByText('Add new Application').parentElement).toBeEnabled();

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
                name: 'Application 2',
                description: 'Description Application 2',
                applicationOwner: 'owner2',
                estateId: 'estate2',
                createTime: '2021-08-17T14:15:47.781Z',
                lastUpdateTime: '2021-08-17T14:15:47.781Z',
                pipelineProvisionStatus: 'ACTIVE',
            },
        ]);
    });
});
