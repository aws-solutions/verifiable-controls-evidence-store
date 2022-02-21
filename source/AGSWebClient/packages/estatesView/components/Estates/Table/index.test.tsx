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
import { render, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EstatesTable from '.';
import { UserGroup } from '@ags/webclient-core/types';
import { EstateDisplay } from '@ags/webclient-estates-core/types';
import * as appContext from '@ags/webclient-core/containers/AppContext';

jest.mock('@ags/webclient-core/containers/AppContext');

const estates: EstateDisplay[] = [
    {
        id: '1',
        name: 'test_estate_1',
        parentBUId: '11',
        parentBUName: '11Name',
        toolingAccountId: '55555',
        environments: [
            {
                id: '1111',
                name: 'env1',
                awsAccountId: '66666',
                creationTime: '2021-11-10T23:20:41.747Z',
                envClasses: ['nonprod'],
                estateId: 'estateId1',
                isManualApprovalRequired: false,
                lastUpdatedTime: '2021-11-10T23:20:41.747Z',
                mandatory: false,
            },
        ],
        creationTime: '2021-11-10T23:20:41.747Z',
        lastUpdatedTime: '2021-11-10T23:20:41.747Z',
    },
    {
        id: '2',
        name: 'test_estate_2',
        parentBUId: '22',
        parentBUName: '22Name',
        toolingAccountId: '55555B',
        environments: [
            {
                id: '2222',
                name: 'env2',
                awsAccountId: '77777',
                creationTime: '2021-11-10T23:20:41.747Z',
                envClasses: ['prod'],
                estateId: 'estateId2',
                isManualApprovalRequired: false,
                lastUpdatedTime: '2021-11-10T23:20:41.747Z',
                mandatory: false,
            },
        ],
        creationTime: '2021-11-10T23:20:41.747Z',
        lastUpdatedTime: '2021-11-10T23:20:41.747Z',
    },
];

describe('Estate Table', () => {
    test('render environments table', () => {
        const mockOnCreate = jest.fn();
        const mockOnEnvClassesMgr = jest.fn();
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        const { getByText, getAllByRole } = render(
            <BrowserRouter>
                <EstatesTable
                    estates={estates}
                    onCreate={mockOnCreate}
                    onEnvClassesMgr={mockOnEnvClassesMgr}
                />
            </BrowserRouter>
        );

        estates.forEach((item) => {
            expect(getByText(item.name)).toBeInTheDocument();
            expect(getByText(item.parentBUName!)).toBeInTheDocument();
            expect(getByText(item.toolingAccountId)).toBeInTheDocument();
            expect(
                getByText(item.environments!.map((env) => env.name).toString())
            ).toBeInTheDocument();
        });

        // buttons
        expect(getByText('Delete').parentElement).toBeDisabled();
        expect(getByText('Update').parentElement).toBeDisabled();
        expect(getByText('Manage Environment Classes').parentElement).toBeEnabled();
        expect(getByText('Request a new Estate').parentElement).toBeEnabled();

        // two radio buttons for selection
        expect(getAllByRole('radio').length).toBe(2);

        fireEvent.click(getByText('Manage Environment Classes'));
        expect(mockOnEnvClassesMgr).toHaveBeenCalled();
        fireEvent.click(getByText('Request a new Estate'));
        expect(mockOnCreate).toHaveBeenCalled();
    });
});
