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
    ControlObjective,
    ControlTechnique,
    DeleteControlObjectiveParams,
    DeleteControlObjectiveResponse,
} from '@ags/webclient-risks-core/types';
import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import {
    useAgsQuery,
    useAgsBatchQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import PageError from '@ags/webclient-core/components/PageError';

import ControlObjectiveDeleteConfirmationModal from '@ags/webclient-risks-view/components/ControlObjectives/DeleteConfirmationModal';
import ControlObjectiveDetailComponent from '@ags/webclient-risks-view/components/ControlObjectives/Detail';
import ControlTechniquesTable from '@ags/webclient-risks-view/components/ControlTechniques/Table';
import {
    ROUTE_CONTROL_OBJECTIVE_UPDATE,
    ROUTE_CONTROL_OBJECTIVES_VIEW,
} from '@ags/webclient-risks-core/config/routes';
import { PERMISSION_RISK_MANAGE } from '@ags/webclient-risks-core/config/permissions';

const ControlObjectiveDetail: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();
    const history = useHistory();

    const { controlObjectiveId } = useParams<{ controlObjectiveId: string }>();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const {
        isLoading,
        isError,
        error,
        data: controlObjective,
    } = useAgsQuery<ControlObjective>(QueryType.GET_CONTROLOBJECTIVE, controlObjectiveId);

    const {
        isLoading: isLoadingControlTechnique,
        isError: isErrorControlTechnique,
        errors: errorsControlTechnique,
        data: controlTechniques,
    } = useAgsBatchQuery<ControlTechnique>(
        QueryType.GET_CONTROLTECHNIQUE,
        controlObjective?.controlTechniqueIds
    );

    const mutation = useAgsMutation<
        DeleteControlObjectiveResponse,
        DeleteControlObjectiveParams,
        Error
    >(MutationType.DELETE_CONTROLOBJECTIVE, {
        onSuccess: (data: DeleteControlObjectiveResponse) => {
            history.replace(ROUTE_CONTROL_OBJECTIVES_VIEW, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Delete Control Objective ${controlObjective?.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: DeleteControlObjectiveParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Control Objective ${controlObjective?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onConfirmDelete = () => {
        console.log(`confirm delete ${controlObjective?.name}`);
        if (controlObjective) {
            mutation.mutate({ id: controlObjective?.id });
        }
    };

    const ActionButtons = useMemo(() => {
        const path = generatePath(ROUTE_CONTROL_OBJECTIVE_UPDATE, {
            controlObjectiveId: controlObjectiveId,
        });

        return (
            <Inline>
                <HasGroups groups={PERMISSION_RISK_MANAGE}>
                    <Button
                        onClick={() => {
                            setShowDeleteConfirmation(true);
                        }}
                    >
                        Delete
                    </Button>
                </HasGroups>
                <HasGroups groups={PERMISSION_RISK_MANAGE}>
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
    }, [controlObjectiveId, history]);

    if (!isLoadingControlTechnique && isErrorControlTechnique) {
        const op = (prevMessage: string, error?: Error) => {
            return `${prevMessage}${prevMessage.length !== 0 ? '\n' : ''}${
                error?.message
            }`;
        };
        const message = errorsControlTechnique.reduce(op, '');
        return (
            <PageError
                header="Error occurs on loading Control Techniques"
                message={message}
            />
        );
    }

    return (
        <QueryContainerTemplate
            loading={isLoading || isLoadingControlTechnique}
            error={isError && error ? error : undefined}
            data={controlObjective}
        >
            {(controlObjective) => (
                <Stack>
                    <HeadingStripe
                        title={controlObjective?.name ?? ''}
                        actionButtons={ActionButtons}
                    />
                    <ControlObjectiveDetailComponent
                        controlObjective={controlObjective}
                    />
                    <ControlTechniquesTable
                        controlTechniques={controlTechniques}
                        disableCreate={true}
                        disableRowSelect={true}
                        disableToolbar={true}
                        disableDelete={true}
                        tableName={`Fulfilled by ${
                            controlTechniques.length
                        } Control Technique${controlTechniques.length > 1 ? 's' : ''}`}
                    />
                    <ControlObjectiveDeleteConfirmationModal
                        controlObjectiveName={controlObjective.name}
                        visible={showDeleteConfirmation}
                        setVisible={setShowDeleteConfirmation}
                        onConfirmed={onConfirmDelete}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default ControlObjectiveDetail;
