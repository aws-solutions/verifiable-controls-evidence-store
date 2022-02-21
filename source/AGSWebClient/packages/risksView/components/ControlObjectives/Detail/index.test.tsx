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
import { ControlObjective } from '@ags/webclient-risks-core/types';
import ControlObjectiveDetail from '.';
import { formatDate } from '@ags/webclient-core/utils/helpers';

const testDateStr1 = '2021-10-11T12:34:56Z';
const testDateStr2 = '2021-10-12T12:34:56Z';

const controlObjective1: ControlObjective = {
    id: '11111',
    name: 'TestObj1',
    description: 'Description1',
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
    controlTechniqueIds: ['123', '456'],
};

const controlObjective2: ControlObjective = {
    id: '22222',
    name: 'TestObj2',
    description: 'Description2',
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
    controlTechniqueIds: [],
};

describe('ControlObjectiveDetail', () => {
    test('render with control techniques', async () => {
        const { getByText, getAllByText } = render(
            <ControlObjectiveDetail controlObjective={controlObjective1} />
        );
        expect(getByText('TestObj1')).toBeInTheDocument();
        expect(getByText('Description1')).toBeInTheDocument();
        expect(getByText(formatDate(new Date(testDateStr1)))).toBeInTheDocument();
        expect(getByText(formatDate(new Date(testDateStr2)))).toBeInTheDocument();
        expect(getAllByText('Fullfiled').length).toBe(2);
    });

    test('render without control techniques', async () => {
        const { getByText, queryAllByText } = render(
            <ControlObjectiveDetail controlObjective={controlObjective2} />
        );
        expect(getByText('TestObj2')).toBeInTheDocument();
        expect(getByText('Description2')).toBeInTheDocument();
        expect(getByText(formatDate(new Date(testDateStr1)))).toBeInTheDocument();
        expect(getByText(formatDate(new Date(testDateStr2)))).toBeInTheDocument();
        expect(queryAllByText('Fullfiled').length).toBe(0);
        expect(queryAllByText('Not Fullfiled').length).toBe(2);
    });
});
