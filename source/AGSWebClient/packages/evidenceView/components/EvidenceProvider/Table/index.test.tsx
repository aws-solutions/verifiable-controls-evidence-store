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

import { BrowserRouter } from 'react-router-dom';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';
import EvidenceProviderTable from '.';
import { UserGroup } from '@ags/webclient-core/types';
import { render } from '@testing-library/react';

jest.mock('@ags/webclient-core/containers/AppContext');

const evidenceProviders: EvidenceProvider[] = [
    {
        providerId: 'canary-authority',
        name: 'canary-authority',
        description: '',
        createdTimestamp: '2021-08-06T05:31:18.367Z',
        enabled: true,
        schemas: [
            {
                schemaId: 'b29cc00a-40ed-47a0-835b-d3a93a43c50b',
            },
            {
                schemaId: 'b7a878f3-588e-4a90-bda6-0b7e4ecf0fc1',
            },
            {
                schemaId: 'bd2ef0ef-2e4d-40d3-a38c-58c471ade77e',
            },
            {
                schemaId: '1718f339-6a01-46ec-b5cb-f5849d8d130e',
            },
        ],
    },
    {
        providerId: 'ba7ac041-0524-4bec-847c-b6389d8d2a06',
        createdTimestamp: '2021-07-25T11:53:02.413Z',
        enabled: true,
        name: 'runTimeConfigSchema',
        description: 'Config Schema for Attestation Runtime',
        schemas: [
            {
                schemaId: 'Operational_Governance_Config_RunTime',
            },
        ],
    },
    {
        providerId: '1f918a50-6f0d-4eea-ab0e-9113e17e290b',
        createdTimestamp: '2021-06-10T06:41:26.367Z',
        enabled: true,
        name: 'AGS-CES',
        description: 'AGS Compliance Evaluation Service',
    },
];

describe('EvidenceProviderTable', () => {
    test('render', async () => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        const { getByText } = render(
            <BrowserRouter>
                <EvidenceProviderTable evidenceProviders={evidenceProviders} />
            </BrowserRouter>
        );
        //Check for Evidence Provider Name
        expect(getByText('canary-authority')).toBeInTheDocument();
        expect(getByText('AGS-CES')).toBeInTheDocument();
        expect(getByText('runTimeConfigSchema')).toBeInTheDocument();

        //Check for Evidence Provider description
        expect(getByText('Config Schema for Attestation Runtime')).toBeInTheDocument();
        expect(getByText('AGS Compliance Evaluation Service')).toBeInTheDocument();
    });
});
