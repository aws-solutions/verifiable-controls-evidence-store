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
import { Risk } from '@ags/webclient-risks-core/types';
import RiskDetail from '.';
import { formatDate } from '@ags/webclient-core/utils/helpers';

const testDateStr1 = '2021-10-11T12:34:56Z';
const testDateStr2 = '2021-10-12T12:34:56Z';

const risk1: Risk = {
    id: '11111',
    name: 'TestObj1',
    description: 'Description1',
    category: 'GENERAL',
    severity: 'HIGH',
    likelihood: 'MODERATE',
    rating: 'LOW',
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
    controlObjectiveIds: ['123', '456'],
};

const risk2: Risk = {
    id: '22222',
    name: 'TestObj2',
    description: 'Description2',
    category: 'GENERAL',
    severity: 'HIGH',
    likelihood: 'MODERATE',
    rating: 'LOW',
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
    controlObjectiveIds: [],
};

describe('RiskDetail', () => {
    test('render with control objectivess', async () => {
        const { getByText, getAllByText } = render(<RiskDetail risk={risk1} />);
        expect(getByText('TestObj1')).toBeInTheDocument();
        expect(getByText('Description1')).toBeInTheDocument();
        expect(getByText('GENERAL')).toBeInTheDocument();
        expect(getByText('HIGH')).toBeInTheDocument();
        expect(getByText('MODERATE')).toBeInTheDocument();
        expect(getByText('LOW')).toBeInTheDocument();
        expect(getByText(formatDate(new Date(testDateStr1)))).toBeInTheDocument();
        expect(getByText(formatDate(new Date(testDateStr2)))).toBeInTheDocument();
        expect(getAllByText('Mitigated').length).toBe(2);
    });

    test('render without control techniques', async () => {
        const { getByText, queryAllByText } = render(<RiskDetail risk={risk2} />);
        expect(getByText('TestObj2')).toBeInTheDocument();
        expect(getByText('Description2')).toBeInTheDocument();
        expect(getByText('GENERAL')).toBeInTheDocument();
        expect(getByText('HIGH')).toBeInTheDocument();
        expect(getByText('MODERATE')).toBeInTheDocument();
        expect(getByText('LOW')).toBeInTheDocument();
        expect(getByText(formatDate(new Date(testDateStr1)))).toBeInTheDocument();
        expect(getByText(formatDate(new Date(testDateStr2)))).toBeInTheDocument();
        expect(queryAllByText('Mitigated').length).toBe(0);
        expect(queryAllByText('Not Mitigated').length).toBe(2);
    });
});
