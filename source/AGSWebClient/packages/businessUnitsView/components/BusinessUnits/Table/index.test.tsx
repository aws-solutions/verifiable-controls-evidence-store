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
import * as appContext from '@ags/webclient-core/containers/AppContext';

import { BrowserRouter, Router } from 'react-router-dom';
import { fireEvent, render } from '@testing-library/react';

import { BusinessUnit } from '@ags/webclient-business-units-core/types';
import BusinessUnitTable from '.';
import { UserGroup } from '@ags/webclient-core/types';
import { createMemoryHistory } from 'history';

jest.mock('@ags/webclient-core/containers/AppContext');

const businessUnits: BusinessUnit[] = [
    {
        id: 'bu-1',
        name: 'Business Unit 1',
        parentId: 'bu-0',
        unitType: 'BusinessUnit',
        description: 'Description Business Unit 1',
        businessOwner: 'business@example.com',
        riskOwner: 'risk@example.com',
        techOwner: 'tech@example.com',
        children: [],
        applicationOwnerIds: [],
        controlObjectiveIds: [],
        createTime: '',
        lastUpdateTime: '',
    },
    {
        id: 'bu-2',
        name: 'Business Unit 2',
        parentId: 'bu-0',
        unitType: 'BusinessUnit',
        description: 'Description Business Unit 2',
        businessOwner: 'business@example.com',
        riskOwner: 'risk@example.com',
        techOwner: 'tech@example.com',
        children: [],
        applicationOwnerIds: [],
        controlObjectiveIds: [],
        createTime: '',
        lastUpdateTime: '',
    },
    {
        id: 'bu-3',
        name: 'Business Unit 3',
        parentId: 'bu-0',
        unitType: 'BusinessUnit',
        description: 'Description Business Unit 3',
        businessOwner: 'business@example.com',
        riskOwner: 'risk@example.com',
        techOwner: 'tech@example.com',
        children: [],
        applicationOwnerIds: [],
        controlObjectiveIds: [],
        createTime: '',
        lastUpdateTime: '',
    },
];

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({
        push: mockHistoryPush,
    }),
}));

describe('BusinessUnitTable', () => {
    test('render', async () => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [
                UserGroup.ServiceManager,
                UserGroup.ChiefRiskOffice,
                UserGroup.DomainOwner,
            ],
        }));

        const history = createMemoryHistory();
        // mock push function
        history.push = jest.fn();

        const { getByText } = render(
            <Router history={history}>
                <BusinessUnitTable
                    businessUnits={businessUnits}
                    parentBusinessUnitId={'bu-0'}
                    disableToolbar={false}
                    disableCreate={false}
                />
            </Router>
        );

        expect(getByText('Business Units (3)')).toBeInTheDocument();
        expect(getByText('Business Unit 1')).toBeInTheDocument();
        expect(getByText('Business Unit 2')).toBeInTheDocument();
        expect(getByText('Business Unit 3')).toBeInTheDocument();

        // button
        expect(getByText('Add new Business Unit').parentElement).toBeEnabled();
        fireEvent.click(getByText('Add new Business Unit'));
        expect(mockHistoryPush).toHaveBeenCalledWith('/businessunits/create/bu-0');
    });

    test('render with no button for no permission', async () => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.Line1Risk],
        }));

        const { getByText, queryByText } = render(
            <BrowserRouter>
                <BusinessUnitTable
                    businessUnits={businessUnits}
                    parentBusinessUnitId={'bu-0'}
                    disableToolbar={false}
                    disableCreate={false}
                />
            </BrowserRouter>
        );

        expect(getByText('Business Units (3)')).toBeInTheDocument();
        expect(getByText('Business Unit 1')).toBeInTheDocument();
        expect(getByText('Business Unit 2')).toBeInTheDocument();
        expect(getByText('Business Unit 3')).toBeInTheDocument();

        // no button
        expect(queryByText('Add new Business Unit')).not.toBeInTheDocument();
    });

    test('render with no input', async () => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.Line1Risk],
        }));

        const { getByText, queryByText } = render(
            <BrowserRouter>
                <BusinessUnitTable />
            </BrowserRouter>
        );

        expect(getByText('Business Units (0)')).toBeInTheDocument();

        // no button
        expect(queryByText('Add new Business Unit')).not.toBeInTheDocument();
    });
});
