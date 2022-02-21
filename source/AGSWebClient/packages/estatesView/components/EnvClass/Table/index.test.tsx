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

import EnvClassesTable from '.';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserGroup } from '@ags/webclient-core/types';
import * as appContext from '@ags/webclient-core/containers/AppContext';

jest.mock('@ags/webclient-core/containers/AppContext');

const envClasses = [
    {
        name: 'test_env_class_prod',
        description: 'Prod',
        creationTime: '2021-11-10T23:20:48.799Z',
    },
    {
        name: 'test_env_class_non_prod',
        description: 'Non Prod',
        creationTime: '2021-11-10T23:20:41.747Z',
    },
];

describe('Environment Table', () => {
    test('render', () => {
        const mockOnCreate = jest.fn();

        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        const { getByText, getAllByRole } = render(
            <BrowserRouter>
                <EnvClassesTable envClasses={envClasses} onCreate={mockOnCreate} />
            </BrowserRouter>
        );
        expect(
            getByText(`Environment Classes (${envClasses.length})`)
        ).toBeInTheDocument();
        envClasses.forEach((item) => {
            expect(getByText(item.name)).toBeInTheDocument();
            expect(getByText(item.description)).toBeInTheDocument();
        });

        // buttons
        expect(getByText('Delete').parentElement).toBeDisabled();
        expect(getByText('Update').parentElement).toBeDisabled();
        expect(getByText('Create a New EnvClass').parentElement).toBeEnabled();

        // two radio buttons for selection
        expect(getAllByRole('radio').length).toBe(envClasses.length);
    });
});
