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
import {
    useAgsQuery,
    useAgsMutation,
    AgsPaginatedQueryResult,
} from '@ags/webclient-core/queries';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import {
    ControlObjectiveSummary,
    DeleteControlObjectiveParams,
    DeleteControlObjectiveResponse,
} from '@ags/webclient-risks-core/types';
import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import ControlObjectiveTable from '../../components/ControlObjectives/Table';
import DeleteConfirmationDialog from '../../components/ControlObjectives/DeleteConfirmationModal';

const ControlObjectivesContainer: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [controlObjectiveToBeDeleted, setControlObjectiveToBeDeleted] =
        useState<ControlObjectiveSummary>();

    const { isLoading, data, isError, error } = useAgsQuery<
        AgsPaginatedQueryResult<ControlObjectiveSummary>
    >(QueryType.LIST_CONTROLOBJECTIVES);

    const mutation = useAgsMutation<
        DeleteControlObjectiveResponse,
        DeleteControlObjectiveParams,
        Error
    >(MutationType.DELETE_CONTROLOBJECTIVE, {
        onSuccess: (data: DeleteControlObjectiveResponse) => {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            addNotification({
                id: uuidv4(),
                type: 'success',
                header: `Delete Control Objective ${controlObjectiveToBeDeleted?.name} Succeeded.`,
                dismissible: true,
            });

            setControlObjectiveToBeDeleted(undefined);
        },
        onError: (error: Error, params: DeleteControlObjectiveParams) => {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Control Objective ${controlObjectiveToBeDeleted?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onDelete = (selectedControlObjectives: ControlObjectiveSummary[]) => {
        console.log('delete ' + selectedControlObjectives[0].name);
        setControlObjectiveToBeDeleted(selectedControlObjectives[0]);
        setShowDeleteConfirmation(true);
    };

    const onConfirmDelete = () => {
        if (controlObjectiveToBeDeleted) {
            setIsDeleting(true);
            mutation.mutate({ id: controlObjectiveToBeDeleted.id });
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
                    <ControlObjectiveTable
                        controlObjectives={data?.results}
                        disableRowSelect={false}
                        OnDeleteControlObjective={onDelete}
                    />
                    <DeleteConfirmationDialog
                        controlObjectiveName={controlObjectiveToBeDeleted?.name ?? ''}
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

export default ControlObjectivesContainer;
