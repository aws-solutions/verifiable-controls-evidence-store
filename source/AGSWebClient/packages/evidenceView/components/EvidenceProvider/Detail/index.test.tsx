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
import { BrowserRouter } from 'react-router-dom';
import { formatDate } from '@ags/webclient-core/utils/helpers';
import { UserGroup } from '@ags/webclient-core/types';
import * as appContext from '@ags/webclient-core/containers/AppContext';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';

import EvidenceProviderDetail from '.';

jest.mock('@ags/webclient-core/containers/AppContext');

const evidenceProvider: EvidenceProvider = {
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
};

describe('Evidence Provider Detail', () => {
    test('render', async () => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        const { getByText } = render(
            <BrowserRouter>
                <EvidenceProviderDetail evidenceProvider={evidenceProvider} />
            </BrowserRouter>
        );
        //Check for Evidence Provider Name
        expect(getByText('runTimeConfigSchema')).toBeInTheDocument();

        //Check for Evidence Provider description
        expect(getByText('Config Schema for Attestation Runtime')).toBeInTheDocument();

        //Check for ISO time conversion
        expect(
            getByText(formatDate(new Date(evidenceProvider.createdTimestamp)))
        ).toBeInTheDocument();
    });
});
