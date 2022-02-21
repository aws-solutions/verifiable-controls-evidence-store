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
import { FunctionComponent, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import Stack from 'aws-northstar/layouts/Stack';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import Inline from 'aws-northstar/layouts/Inline';
import Button from 'aws-northstar/components/Button';
import HasService from '@ags/webclient-core/components/HasService';

import { useAgsQuery } from '@ags/webclient-core/queries';
import { QueryType } from '@ags/webclient-application-release-core/queries';
import {
    Application,
    ReleaseCandidate,
} from '@ags/webclient-application-release-core/types';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import ReleaseCandidateDetailComponent from '@ags/webclient-application-release-view/components/ReleaseCandidates/Detail';
import DeploymentTable from '@ags/webclient-application-release-view/components/ReleaseCandidates/Table/Deployment';
import ArtifactTable from '@ags/webclient-application-release-view/components/ReleaseCandidates/Table/Artifact';
import { Estate } from '@ags/webclient-estates-core/types';
import { QueryType as EstateQueryType } from '@ags/webclient-estates-core/queries';
import { useLocation } from 'react-router-dom';

const ReleaseCandidateDetail: FunctionComponent = () => {
    const history = useHistory();

    const { releaseCandidateId } = useParams<{ releaseCandidateId: string }>();
    const {
        isLoading,
        isError,
        error,
        data: releaseCandidate,
    } = useAgsQuery<ReleaseCandidate>(
        QueryType.GET_RELEASE_CANDIDATE,
        releaseCandidateId
    );

    const { data: application } = useAgsQuery<Application>(
        QueryType.GET_APPLICATION,
        releaseCandidate?.applicationId ?? ''
    );

    const { data: estate } = useAgsQuery<Estate>(
        EstateQueryType.GET_ESTATE,
        application?.estateId ?? ''
    );

    const path = useLocation().pathname;
    const evidences = releaseCandidate?.deployments.map((d) => d.deploymentId).join(',');
    const ActionButtons = useMemo(() => {
        return (
            <Inline>
                <HasService service="AGSEvidenceStore">
                    <Button
                        onClick={() => {
                            history.push(
                                `/evidences/?targetIds=${evidences}&returnUrl=${path}`
                            );
                        }}
                    >
                        View Evidences
                    </Button>
                </HasService>
            </Inline>
        );
    }, [evidences, history, path]);

    return (
        <QueryContainerTemplate
            loading={isLoading}
            error={isError && error ? error : undefined}
            data={releaseCandidate}
        >
            {(releaseCandidate) => (
                <Stack>
                    <HeadingStripe
                        title={releaseCandidateId ?? ''}
                        actionButtons={ActionButtons}
                    />
                    <ReleaseCandidateDetailComponent
                        releaseCandidate={releaseCandidate}
                    />
                    <DeploymentTable
                        deployments={releaseCandidate.deployments}
                        estate={estate}
                    />
                    <ArtifactTable artifacts={releaseCandidate.artifacts} />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default ReleaseCandidateDetail;
