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
import { FunctionComponent, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Stack from 'aws-northstar/layouts/Stack';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import {
    ApplicationSummary,
    DeleteApplicationParams,
    DeleteApplicationResponse,
} from '@ags/webclient-application-release-core/types';
import { QueryType, MutationType } from '@ags/webclient-application-release-core/queries';
import ApplicationTable from '../../components/Applications/Table';
import DeleteConfirmationDialog from '../../components/Applications/DeleteConfirmationModal';

const ApplicationsContainer: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [applicationToBeDeleted, setApplicationToBeDeleted] =
        useState<ApplicationSummary>();

    const { isLoading, data, isError, error } = useAgsListQuery<ApplicationSummary>(
        QueryType.LIST_ALL_APPLICATIONS
    );
    const mutation = useAgsMutation<
        DeleteApplicationResponse,
        DeleteApplicationParams,
        Error
    >(MutationType.DELETE_APPLICATION, {
        onSuccess: (data: DeleteApplicationResponse) => {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            addNotification({
                id: uuidv4(),
                type: 'success',
                header: `Delete Application ${applicationToBeDeleted?.name} Succeeded.`,
                dismissible: true,
            });

            setApplicationToBeDeleted(undefined);
        },
        onError: (error: Error, params: DeleteApplicationParams) => {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Application ${applicationToBeDeleted?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onDelete = (selectedApplications: ApplicationSummary[]) => {
        console.log('delete ' + selectedApplications[0].name);
        setApplicationToBeDeleted(selectedApplications[0]);
        setShowDeleteConfirmation(true);
    };

    const onConfirmDelete = (forceDelete: boolean = false) => {
        if (applicationToBeDeleted) {
            setIsDeleting(true);
            mutation.mutate({
                name: applicationToBeDeleted.name,
                forceDelete: forceDelete,
            });
        }
    };

    return (
        <QueryContainerTemplate
            data={data}
            loading={isLoading}
            error={isError && error ? error : undefined}
        >
            {() => (
                <Stack>
                    <ApplicationTable
                        applications={data}
                        disableRowSelect={false}
                        OnDeleteApplication={onDelete}
                    />
                    <DeleteConfirmationDialog
                        applicationName={applicationToBeDeleted?.name ?? ''}
                        pipelineProvisionStatus={
                            applicationToBeDeleted?.pipelineProvisionStatus ?? ''
                        }
                        visible={showDeleteConfirmation}
                        setVisible={setShowDeleteConfirmation}
                        onConfirmed={onConfirmDelete}
                        isDeleting={isDeleting}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default ApplicationsContainer;
