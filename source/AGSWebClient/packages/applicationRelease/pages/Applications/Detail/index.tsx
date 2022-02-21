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
import { FunctionComponent, useMemo, useState } from 'react';
import { useParams, generatePath, useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import Stack from 'aws-northstar/layouts/Stack';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import Inline from 'aws-northstar/layouts/Inline';
import Button from 'aws-northstar/components/Button';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import {
    Application,
    DeleteApplicationParams,
    DeleteApplicationResponse,
    ReleaseCandidate,
} from '@ags/webclient-application-release-core/types';
import { QueryType, MutationType } from '@ags/webclient-application-release-core/queries';
import { useAgsQuery, useAgsMutation } from '@ags/webclient-core/queries';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';

import ApplicationDeleteConfirmationModal from '@ags/webclient-application-release-view/components/Applications/DeleteConfirmationModal';
import ApplicationDetailComponent from '@ags/webclient-application-release-view/components/Applications/Detail';
import ReleaseCandidateTable from '@ags/webclient-application-release-view/components/ReleaseCandidates/Table';
import {
    ROUTE_APPLICATION_UPDATE,
    ROUTE_APPLICATIONS_VIEW,
} from '@ags/webclient-application-release-core/config/routes';
import { PERMISSION_APPLICATION_MANAGE } from '@ags/webclient-application-release-core/config/permissions';
import { Estate } from '@ags/webclient-estates-core/types';
import { QueryType as EstateQueryType } from '@ags/webclient-estates-core/queries';

const ApplicationDetail: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();
    const history = useHistory();

    const { applicationId } = useParams<{ applicationId: string }>();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const {
        isLoading,
        isError,
        error,
        data: application,
    } = useAgsQuery<Application>(QueryType.GET_APPLICATION, applicationId);

    const { isLoading: isLoadingRc, data: releaseResponse } = useAgsQuery<{
        results: ReleaseCandidate[];
    }>(QueryType.GET_RELEASE_CANDIDATES, applicationId);

    const { data: estate } = useAgsQuery<Estate>(
        EstateQueryType.GET_ESTATE,
        application?.estateId ?? ''
    );

    const mutation = useAgsMutation<
        DeleteApplicationResponse,
        DeleteApplicationParams,
        Error
    >(MutationType.DELETE_APPLICATION, {
        onSuccess: (data: DeleteApplicationResponse) => {
            history.replace(ROUTE_APPLICATIONS_VIEW, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Delete Application ${application?.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: DeleteApplicationParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Application ${application?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onConfirmDelete = (forceDelete: boolean = false) => {
        console.log(`confirm delete ${application?.name}`);
        if (application) {
            mutation.mutate({ name: application?.name, forceDelete: forceDelete });
        }
    };

    const ActionButtons = useMemo(() => {
        const path = generatePath(ROUTE_APPLICATION_UPDATE, {
            applicationId: applicationId,
        });

        return (
            <Inline>
                <HasGroups groups={PERMISSION_APPLICATION_MANAGE}>
                    <Button
                        onClick={() => {
                            setShowDeleteConfirmation(true);
                        }}
                    >
                        Delete
                    </Button>
                </HasGroups>
                <HasGroups groups={PERMISSION_APPLICATION_MANAGE}>
                    <Button
                        onClick={() => {
                            history.push(path);
                        }}
                    >
                        Edit
                    </Button>
                </HasGroups>
            </Inline>
        );
    }, [applicationId, history]);

    return (
        <QueryContainerTemplate
            loading={isLoading || isLoadingRc}
            error={isError && error ? error : undefined}
            data={application}
        >
            {(application) => (
                <Stack>
                    <HeadingStripe
                        title={application?.name ?? ''}
                        actionButtons={ActionButtons}
                    />
                    <ApplicationDetailComponent
                        application={application}
                        estate={estate}
                    />
                    <ReleaseCandidateTable releaseCandidates={releaseResponse?.results} />
                    <ApplicationDeleteConfirmationModal
                        applicationName={application.name}
                        pipelineProvisionStatus={application.pipelineProvisionStatus}
                        visible={showDeleteConfirmation}
                        setVisible={setShowDeleteConfirmation}
                        onConfirmed={onConfirmDelete}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default ApplicationDetail;
