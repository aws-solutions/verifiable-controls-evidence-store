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
import { render } from '@testing-library/react';
import EnvironmentsTable from '.';
import { BrowserRouter } from 'react-router-dom';
import { Environment } from '@ags/webclient-estates-core/types';

const environments: Environment[] = [
    {
        id: '1',
        name: 'NonProd',
        estateId: 'estateId1',
        envClasses: ['nonprod'],
        mandatory: true,
        awsAccountId: '11112222',
        creationTime: '2021-11-10T23:20:41.747Z',
        lastUpdatedTime: '2021-11-10T23:20:41.747Z',
        isManualApprovalRequired: false,
    },
    {
        id: '2',
        name: 'Prod',
        estateId: 'estateId1',
        envClasses: ['prod'],
        mandatory: false,
        awsAccountId: '11113333',
        creationTime: '2021-11-10T23:20:41.747Z',
        lastUpdatedTime: '2021-11-10T23:20:41.747Z',
        isManualApprovalRequired: false,
    },
];

describe('Environments Table', () => {
    test('render environments table', () => {
        const { getByText } = render(
            <BrowserRouter>
                <EnvironmentsTable environments={environments} />
            </BrowserRouter>
        );
        expect(getByText(`Environments (${environments.length})`)).toBeInTheDocument();
        environments.forEach((item) => {
            expect(getByText(item.name)).toBeInTheDocument();
            expect(getByText(item.awsAccountId)).toBeInTheDocument();
            expect(getByText(item.envClasses.toString())).toBeInTheDocument();
        });
    });
});
