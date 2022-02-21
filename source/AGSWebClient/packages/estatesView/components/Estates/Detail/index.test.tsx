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
import { EstateDisplay } from '@ags/webclient-estates-core/types';
import { render } from '@testing-library/react';
import EstateDetail from '.';

jest.mock('@ags/webclient-core/containers/AppContext');

const estate: EstateDisplay = {
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
};

describe('Estate detail', () => {
    test('render', () => {
        const { getByText } = render(<EstateDetail estate={estate} />);
        expect(getByText(`Estate Details - ${estate.name}`)).toBeInTheDocument();
        expect(getByText('Name')).toBeInTheDocument();
        expect(getByText(estate.name)).toBeInTheDocument();
        expect(getByText('Created At')).toBeInTheDocument();
        expect(getByText('Environments')).toBeInTheDocument();
        expect(getByText(estate.environments!.length)).toBeInTheDocument();
        expect(getByText('Tooling Account')).toBeInTheDocument();
        expect(getByText(estate.toolingAccountId)).toBeInTheDocument();
        expect(getByText('Last Updated At')).toBeInTheDocument();
        expect(getByText('Business Unit')).toBeInTheDocument();
        expect(getByText(estate.parentBUName!)).toBeInTheDocument();
    });
});
