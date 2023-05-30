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

import { BusinessUnit } from '@ags/webclient-business-units-core/types';
import BusinessUnitDetail from '.';
import { render } from '@testing-library/react';

const testDateStr1 = '2021-10-11T12:34:56Z';
const testDateStr2 = '2021-10-12T12:34:56Z';

const businessUnit1: BusinessUnit = {
    id: '11111',
    parentId: '00000',
    name: 'TestBusinessUnit1',
    unitType: 'BusinessUnit',
    description: 'Description1',
    businessOwner: 'business@example.com',
    riskOwner: 'risk@example.com',
    techOwner: 'tech@example.com',
    children: [],
    applicationOwnerIds: [],
    controlObjectiveIds: [],
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
};

const parentBusinessUnit: BusinessUnit = {
    id: '00000',
    parentId: '',
    name: 'Test Enterprise',
    unitType: 'Enterprise',
    description: 'Enterprise Description',
    businessOwner: 'ent-business@example.com',
    riskOwner: 'ent-risk@example.com',
    techOwner: 'ent-tech@example.com',
    children: [],
    applicationOwnerIds: [],
    controlObjectiveIds: [],
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
};

describe('BusinessUnitDetail', () => {
    test('render with control techniques', async () => {
        const { getByText } = render(
            <BusinessUnitDetail
                businessUnit={businessUnit1}
                parentBusinessUnit={parentBusinessUnit}
            />
        );
        expect(getByText('TestBusinessUnit1')).toBeInTheDocument();
        expect(getByText('Test Enterprise')).toBeInTheDocument();
        expect(getByText('Description1')).toBeInTheDocument();
        expect(getByText('business@example.com')).toBeInTheDocument();
        expect(getByText('risk@example.com')).toBeInTheDocument();
        expect(getByText('tech@example.com')).toBeInTheDocument();
    });
});
