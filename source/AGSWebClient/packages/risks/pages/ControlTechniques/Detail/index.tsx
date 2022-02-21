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

import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import Stack from 'aws-northstar/layouts/Stack';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import Inline from 'aws-northstar/layouts/Inline';
import Button from 'aws-northstar/components/Button';

import {
    ControlObjective,
    ControlTechnique,
    DeleteControlTechniqueParams,
    DeleteControlTechniqueResponse,
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

import ControlTechniqueDeleteConfirmationModal from '@ags/webclient-risks-view/components/ControlTechniques/DeleteConfirmationModal';
import ControlTechniqueDetailComponent from '@ags/webclient-risks-view/components/ControlTechniques/Detail';
import ControlObjectiveTable from '@ags/webclient-risks-view/components/ControlObjectives/Table';
import {
    ROUTE_CONTROL_TECHNIQUE_UPDATE,
    ROUTE_CONTROL_TECHNIQUES_VIEW,
} from '@ags/webclient-risks-core/config/routes';
import { PERMISSION_RISK_MANAGE } from '@ags/webclient-risks-core/config/permissions';

const ControlTechniqueDetail: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();
    const history = useHistory();

    const { controlTechniqueId } = useParams<{ controlTechniqueId: string }>();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const {
        isLoading,
        isError,
        error,
        data: controlTechnique,
    } = useAgsQuery<ControlTechnique>(QueryType.GET_CONTROLTECHNIQUE, controlTechniqueId);

    const {
        isLoading: isLoadingControlObjectives,
        isError: isErrorControlObjectives,
        errors: errorsControlObjectives,
        data: controlObjectives,
    } = useAgsBatchQuery<ControlObjective>(
        QueryType.GET_CONTROLOBJECTIVE,
        controlTechnique?.controlObjectives
    );

    const mutation = useAgsMutation<
        DeleteControlTechniqueResponse,
        DeleteControlTechniqueParams,
        Error
    >(MutationType.DELETE_CONTROLTECHNIQUE, {
        onSuccess: (data: DeleteControlTechniqueResponse) => {
            history.replace(ROUTE_CONTROL_TECHNIQUES_VIEW, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Delete Control Technique ${controlTechnique?.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: DeleteControlTechniqueParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Control Technique ${controlTechnique?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onConfirmDelete = () => {
        console.log(`confirm delete ${controlTechnique?.name}`);
        if (controlTechnique) {
            mutation.mutate({ id: controlTechnique?.id });
        }
    };

    const ActionButtons = useMemo(() => {
        const path = generatePath(ROUTE_CONTROL_TECHNIQUE_UPDATE, {
            controlTechniqueId: controlTechniqueId,
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
    }, [controlTechniqueId, history]);

    if (!isLoadingControlObjectives && isErrorControlObjectives) {
        const op = (prevMessage: string, error?: Error) => {
            return `${prevMessage}${prevMessage.length !== 0 ? '\n' : ''}${
                error?.message
            }`;
        };
        const message = errorsControlObjectives.reduce(op, '');
        return (
            <PageError
                header="Error occurs on loading Control Objectives"
                message={message}
            />
        );
    }

    return (
        <QueryContainerTemplate
            loading={isLoading || isLoadingControlObjectives}
            error={isError && error ? error : undefined}
            data={controlTechnique}
        >
            {(controlTechnique) => (
                <Stack>
                    <HeadingStripe
                        title={controlTechnique?.name ?? ''}
                        actionButtons={ActionButtons}
                    />
                    <ControlTechniqueDetailComponent
                        controlTechnique={controlTechnique}
                    />
                    <ControlObjectiveTable
                        controlObjectives={controlObjectives}
                        disableCreate={true}
                        disableRowSelect={true}
                        disableToolbar={true}
                        disableDelete={true}
                        tableName={`Fulfills ${
                            controlObjectives.length
                        } Control Objective${controlObjectives.length > 1 ? 's' : ''}`}
                    />
                    <ControlTechniqueDeleteConfirmationModal
                        controlTechniqueName={controlTechnique.name}
                        visible={showDeleteConfirmation}
                        setVisible={setShowDeleteConfirmation}
                        onConfirmed={onConfirmDelete}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default ControlTechniqueDetail;
