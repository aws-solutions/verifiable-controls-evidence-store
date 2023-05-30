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
import { Application } from '@ags/webclient-application-release-core/types';
import ApplicationDetail from '.';
import { render } from '@testing-library/react';

const testDateStr1 = '2021-10-11T12:34:56Z';
const testDateStr2 = '2021-10-12T12:34:56Z';

const application1: Application = {
    name: 'TestApp1',
    description: 'Description1',
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
    applicationOwner: 'owner1',
    estateId: 'estate1',
    environmentIds: ['env1', 'env2'],
    pipelineData: {
        testData: 'testVal1',
    },
    pipelineProvisionError: '',
    pipelineProvisionStatus: 'ACTIVE',
    attributes: {
        hostingConstruct: 'lambda',
        dataClassification: 'PII',
    },
    metadata: {
        codeSigningCertFingerprint: 'fingerprint',
    },
};

const application2: Application = {
    name: 'TestApp2',
    description: 'Description2',
    createTime: testDateStr1,
    lastUpdateTime: testDateStr2,
    applicationOwner: 'owner2',
    estateId: 'estate2',
    environmentIds: ['env3', 'env4'],
    pipelineData: {
        testData: 'testVal2',
    },
    pipelineProvisionError: '',
    pipelineProvisionStatus: 'CREATING',
    attributes: {
        hostingConstruct: 'ecs',
        dataClassification: 'Private',
    },
    metadata: {
        codeSigningCertFingerprint: 'fingerprint2',
    },
};

describe('ApplicationDetail', () => {
    test('render with application', async () => {
        const { getByText, getAllByText } = render(
            <ApplicationDetail application={application1} />
        );
        expect(getByText('TestApp1')).toBeInTheDocument();
        expect(getByText('Description1')).toBeInTheDocument();
        expect(getByText('owner1')).toBeInTheDocument();
        expect(getByText('testVal1')).toBeInTheDocument();
        expect(getAllByText('ACTIVE').length).toBe(2);
        expect(getByText('lambda')).toBeInTheDocument();
        expect(getByText('PII')).toBeInTheDocument();
    });

    test('render without application', async () => {
        const { getByText, getAllByText } = render(
            <ApplicationDetail application={application2} />
        );
        expect(getByText('TestApp2')).toBeInTheDocument();
        expect(getByText('Description2')).toBeInTheDocument();
        expect(getByText('owner2')).toBeInTheDocument();
        expect(getByText('testVal2')).toBeInTheDocument();
        expect(getAllByText('CREATING').length).toBe(2);
        expect(getByText('ecs')).toBeInTheDocument();
        expect(getByText('Private')).toBeInTheDocument();
    });
});
