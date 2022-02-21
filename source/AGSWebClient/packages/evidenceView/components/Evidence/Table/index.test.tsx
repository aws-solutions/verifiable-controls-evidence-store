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
import * as appContext from '@ags/webclient-core/containers/AppContext';
import { UserGroup } from '@ags/webclient-core/types';
import EvidencesTable from '.';
import { Evidence } from '@ags/webclient-evidence-core/types';

jest.mock('@ags/webclient-core/containers/AppContext');

const evidences: Evidence[] = [];
for (let i = 1; i <= 15; i++) {
    evidences.push({
        evidenceId: '1234',
        providerId: 'authority',
        schemaId: 'schema',
        providerName: 'testing',
        createdTimestamp: new Date().toISOString(),
        targetId: 'target',
    });
}
describe('evidence table tests', () => {
    test('render', () => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.ApplicationOwner],
        }));

        const { getByText, getAllByRole } = render(
            <BrowserRouter>
                <EvidencesTable
                    evidences={evidences}
                    total={evidences.length}
                ></EvidencesTable>
            </BrowserRouter>
        );

        expect(getByText('Evidence (15)')).toBeInTheDocument();
        expect(getAllByRole('button').length).toBe(5);
        expect(getAllByRole('table').length).toBe(1);
    });
});
