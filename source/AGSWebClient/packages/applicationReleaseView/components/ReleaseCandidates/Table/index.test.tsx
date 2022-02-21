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
import { ReleaseCandidate } from '@ags/webclient-application-release-core/types';
import { UserGroup } from '@ags/webclient-core/types';
import ReleaseTable from '.';
import * as appContext from '@ags/webclient-core/containers/AppContext';

jest.mock('@ags/webclient-core/containers/AppContext');

const releases: ReleaseCandidate[] = [
    {
        releaseCandidateId: 'r-1',
        commitId: 'Release 1',
        externalPipelineExecutionId: 'Execution Id 1',
        externalPipelineId: 'Description Release 1',
        applicationId: 'app1',
        sourceLocation: 'sourceLocation1',
        releaseArtifactUri: 'releaseArtifactUri1',
        graphBuild: true,
        deployments: [],
        artifacts: [],
        creationTime: '2021-08-17T14:15:47.781Z',
    },
    {
        releaseCandidateId: 'r-2',
        commitId: 'Release 2',
        externalPipelineExecutionId: 'Execution Id 2',
        externalPipelineId: 'Description Release 2',
        applicationId: 'app2',
        sourceLocation: 'sourceLocation2',
        releaseArtifactUri: 'releaseArtifactUri2',
        graphBuild: true,
        deployments: [],
        artifacts: [],
        creationTime: '2021-08-17T14:15:47.781Z',
    },
    {
        releaseCandidateId: 'r-3',
        commitId: 'Release 3',
        externalPipelineExecutionId: 'Execution Id 3',
        externalPipelineId: 'Description Release 3',
        applicationId: 'app3',
        sourceLocation: 'sourceLocation3',
        releaseArtifactUri: 'releaseArtifactUri3',
        graphBuild: true,
        deployments: [],
        artifacts: [],
        creationTime: '2021-08-17T14:15:47.781Z',
    },
];

describe('ReleaseTable', () => {
    test('render', async () => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        const { getByText } = render(
            <BrowserRouter>
                <ReleaseTable
                    releaseCandidates={releases}
                    disableRowSelect={false}
                    disableToolbar={false}
                    disableCreate={false}
                    disableDelete={false}
                />
            </BrowserRouter>
        );

        expect(getByText('Release Candidates (3)')).toBeInTheDocument();
        expect(getByText('Release 1')).toBeInTheDocument();
        expect(getByText('Release 2')).toBeInTheDocument();
        expect(getByText('Release 3')).toBeInTheDocument();
    });
});
