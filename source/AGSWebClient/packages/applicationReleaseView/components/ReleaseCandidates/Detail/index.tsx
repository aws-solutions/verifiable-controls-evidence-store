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
import { FunctionComponent } from 'react';
import { formatDate } from '@ags/webclient-core/utils/helpers';
import Container from 'aws-northstar/layouts/Container';
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout';
import Stack from 'aws-northstar/layouts/Stack';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import { ReleaseCandidate } from '@ags/webclient-application-release-core/types';
import Link from 'aws-northstar/components/Link';
import { BrowserRouter } from 'react-router-dom';

export interface ReleaseCandidateDetailProps {
    releaseCandidate: ReleaseCandidate;
}

const ReleaseCandidateDetail: FunctionComponent<ReleaseCandidateDetailProps> = ({
    releaseCandidate,
}) => {
    const sourceLink = (url: string) => (
        <BrowserRouter>
            <Link href={url} target="_blank">
                {url}
            </Link>
        </BrowserRouter>
    );
    return (
        <Container title="General Information">
            <ColumnLayout renderDivider={true}>
                <Column>
                    <Stack>
                        <KeyValuePair
                            label="Release Candidate Id"
                            value={releaseCandidate.releaseCandidateId}
                        />
                        <KeyValuePair
                            label="Application Id"
                            value={releaseCandidate.applicationId}
                        />
                        <KeyValuePair
                            label="Commit Id"
                            value={releaseCandidate.commitId}
                        />
                        <KeyValuePair
                            label="Created At"
                            value={
                                releaseCandidate.creationTime &&
                                formatDate(new Date(releaseCandidate.creationTime))
                            }
                        />
                    </Stack>
                </Column>
                <Column>
                    <Stack>
                        <KeyValuePair
                            label="External Pipeline Id"
                            value={releaseCandidate.externalPipelineId}
                        />
                        <KeyValuePair
                            label="External Pipeline Execution Id"
                            value={releaseCandidate.externalPipelineExecutionId}
                        />
                        <KeyValuePair
                            label="Source Location"
                            value={sourceLink(releaseCandidate.sourceLocation)}
                        />
                        <KeyValuePair
                            label="Release Artifact Uri"
                            value={releaseCandidate.releaseArtifactUri}
                        />
                    </Stack>
                </Column>
            </ColumnLayout>
        </Container>
    );
};
export default ReleaseCandidateDetail;
