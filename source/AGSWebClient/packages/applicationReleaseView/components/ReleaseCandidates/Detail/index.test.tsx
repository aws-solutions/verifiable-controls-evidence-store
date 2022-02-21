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
import { ReleaseCandidate } from '@ags/webclient-application-release-core/types';
import ReleaseCandidateDetail from '.';

const releaseCandidate1: ReleaseCandidate = {
    releaseCandidateId: 'r-1',
    commitId: 'Commit 1',
    externalPipelineExecutionId: 'GENERAL1',
    externalPipelineId: 'Description Release 1',
    applicationId: 'app1',
    sourceLocation: 'src1',
    releaseArtifactUri: 'uri1',
    graphBuild: true,
    deployments: [],
    artifacts: [],
    creationTime: '',
};

describe('ReleaseCandidateDetail', () => {
    test('render with release candidate', async () => {
        const { getByText } = render(
            <ReleaseCandidateDetail releaseCandidate={releaseCandidate1} />
        );
        expect(getByText('r-1')).toBeInTheDocument();
        expect(getByText('Commit 1')).toBeInTheDocument();
        expect(getByText('GENERAL1')).toBeInTheDocument();
        expect(getByText('Description Release 1')).toBeInTheDocument();
        expect(getByText('app1')).toBeInTheDocument();
        expect(getByText('src1')).toBeInTheDocument();
        expect(getByText('uri1')).toBeInTheDocument();
    });
});
