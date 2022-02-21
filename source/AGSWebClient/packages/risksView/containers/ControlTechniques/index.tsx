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
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import {
    ControlTechniqueSummary,
    DeleteControlTechniqueParams,
    DeleteControlTechniqueResponse,
} from '@ags/webclient-risks-core/types';
import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import ControlTechniquesTable from '../../components/ControlTechniques/Table';
import ControlTechniqueeDeleteConfirmationModal from '../../components/ControlTechniques/DeleteConfirmationModal';

const ControlTechniquesView: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [controlTechniqueToBeDeleted, setControlTechniqueToBeDeleted] =
        useState<ControlTechniqueSummary>();

    // load control techniques
    const { isLoading, data, isError, error } = useAgsListQuery<ControlTechniqueSummary>(
        QueryType.LIST_ALL_CONTROLTECHNIQUES
    );

    const mutation = useAgsMutation<
        DeleteControlTechniqueResponse,
        DeleteControlTechniqueParams,
        Error
    >(MutationType.DELETE_CONTROLTECHNIQUE, {
        onSuccess: (data: DeleteControlTechniqueResponse) => {
            addNotification({
                id: uuidv4(),
                type: 'success',
                header: `Delete Control Technique ${controlTechniqueToBeDeleted?.name} Succeeded.`,
                dismissible: true,
            });

            setControlTechniqueToBeDeleted(undefined);
        },
        onError: (error: Error, params: DeleteControlTechniqueParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Control Technique ${controlTechniqueToBeDeleted?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onDelete = (selectedControlTechniques: ControlTechniqueSummary[]) => {
        console.log('delete ' + selectedControlTechniques[0].name);
        setControlTechniqueToBeDeleted(selectedControlTechniques[0]);
        setShowDeleteConfirmation(true);
    };

    const onConfirmDelete = () => {
        console.log(`confirm delete ${controlTechniqueToBeDeleted?.name}`);
        if (controlTechniqueToBeDeleted) {
            mutation.mutate({ id: controlTechniqueToBeDeleted.id });
        }
    };

    return (
        <QueryContainerTemplate
            loading={isLoading}
            error={isError && error ? error : undefined}
            data={data}
        >
            {(data) => {
                return (
                    <Stack>
                        <ControlTechniquesTable
                            controlTechniques={data}
                            disableRowSelect={false}
                            onDeleteControlTechnique={onDelete}
                        />
                        <ControlTechniqueeDeleteConfirmationModal
                            controlTechniqueName={controlTechniqueToBeDeleted?.name ?? ''}
                            visible={showDeleteConfirmation}
                            setVisible={setShowDeleteConfirmation}
                            onConfirmed={onConfirmDelete}
                        />
                    </Stack>
                );
            }}
        </QueryContainerTemplate>
    );
};

export default ControlTechniquesView;
