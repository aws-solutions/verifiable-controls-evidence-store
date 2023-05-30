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
import { ControlTechnique } from '@ags/webclient-risks-core/types';
import ControlTechniqueDetail from '.';
import { render } from '@testing-library/react';

const testDateStr1 = '2021-10-11T12:34:56Z';
const testDateStr2 = '2021-10-12T12:34:56Z';

const controlTechnique1: ControlTechnique = {
    id: '11111',
    name: 'TestTechnique1',
    description: 'Description1',
    controlType: 'DETECTIVE',
    status: 'ACTIVE',
    enabled: true,
    techniqueDetails: {
        integrationType: 'NONE',
    },
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
    controlObjectives: ['123', '456'],
};

const controlTechnique2: ControlTechnique = {
    id: '22222',
    name: 'TestTechnique2',
    description: 'Description2',
    controlType: 'PREVENTIVE',
    status: 'INACTIVE',
    enabled: false,
    techniqueDetails: {
        integrationType: 'REST',
        policyId: 'test-policy',
        bundleName: 'test-bundle',
        namespace: 'test-namespace',
        restEndpoint: 'https://test-endpoint',
        eventBus: 'test-event-bus',
        detailType: 'test-detail-type',
        awsPolicyArn: 'test-policy-arn',
        configRuleArn: 'test-cp-rule-arn',
        cpSourceUrls: 'https://localhost',
    },
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
    controlObjectives: [],
};

describe('ControlTechiqueDetail', () => {
    test('render with control objectives', async () => {
        const { getByText, queryAllByText } = render(
            <ControlTechniqueDetail controlTechnique={controlTechnique1} />
        );
        expect(getByText('TestTechnique1')).toBeInTheDocument();
        expect(getByText('Description1')).toBeInTheDocument();
        expect(getByText('DETECTIVE')).toBeInTheDocument();
        expect(getByText('ACTIVE')).toBeInTheDocument();
        expect(queryAllByText('Enabled').length).toBe(2);
        expect(getByText('Technique Details')).toBeInTheDocument();
        expect(getByText('NONE')).toBeInTheDocument();
    });

    test('render without control techniques', async () => {
        const { getByText, queryAllByText } = render(
            <ControlTechniqueDetail controlTechnique={controlTechnique2} />
        );
        expect(getByText('TestTechnique2')).toBeInTheDocument();
        expect(getByText('Description2')).toBeInTheDocument();
        expect(getByText('PREVENTIVE')).toBeInTheDocument();
        expect(getByText('INACTIVE')).toBeInTheDocument();
        expect(queryAllByText('Disabled').length).toBe(2);
        expect(getByText('Technique Details')).toBeInTheDocument();
        expect(getByText('REST')).toBeInTheDocument();
        expect(getByText('test-policy')).toBeInTheDocument();
        expect(getByText('test-bundle')).toBeInTheDocument();
        expect(getByText('test-namespace')).toBeInTheDocument();
        expect(getByText('https://test-endpoint')).toBeInTheDocument();
        expect(getByText('test-event-bus')).toBeInTheDocument();
        expect(getByText('test-detail-type')).toBeInTheDocument();
        expect(getByText('test-policy-arn')).toBeInTheDocument();
        expect(getByText('test-cp-rule-arn')).toBeInTheDocument();
        expect(getByText('https://localhost')).toBeInTheDocument();
    });
});
