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
    Risk,
    RiskV2,
    ControlObjective,
    DeleteRiskParams,
    DeleteRiskResponse,
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

import RiskDeleteConfirmationModal from '@ags/webclient-risks-view/components/Risks/DeleteConfirmationModal';
import RiskDetailComponent from '@ags/webclient-risks-view/components/RisksV2/Detail';
import ControlObjectiveTable from '@ags/webclient-risks-view/components/ControlObjectives/Table';
import {
    ROUTE_RISK_UPDATE,
    ROUTE_RISKS_VIEW,
} from '@ags/webclient-risks-core/config/routes';
import { PERMISSION_RISK_MANAGE } from '@ags/webclient-risks-core/config/permissions';
import RiskTargetEntities from '@ags/webclient-risks-view/components/RisksV2/RiskTargetEntities';

const mockRisk: RiskV2 = {
    lastUpdateTime: '2021-09-03T08:02:27.444Z',
    category: 'CYBERSECURITY',
    createTime: '2021-08-17T14:15:47.781Z',
    description: 'Accidental public exposure of data and artifacts',
    id: '50256ce7-dba5-4eb0-9a65-142740c0966e',
    name: 'Accidental public exposure of data and artifacts',
    mitigationStatus: 'PARTIALLY_MITIGATED',
};

const RiskDetail: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();
    const history = useHistory();

    const { riskId } = useParams<{ riskId: string }>();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const {
        isLoading,
        isError,
        error,
        data: risk,
    } = useAgsQuery<Risk>(QueryType.GET_RISK, riskId);

    const {
        isLoading: isLoadingControlObjective,
        isError: isErrorControlObjective,
        errors: errorsControlObjective,
        data: controlObjectives,
    } = useAgsBatchQuery<ControlObjective>(
        QueryType.GET_CONTROLOBJECTIVE,
        risk?.controlObjectiveIds
    );

    const mutation = useAgsMutation<DeleteRiskResponse, DeleteRiskParams, Error>(
        MutationType.DELETE_RISK,
        {
            onSuccess: (data: DeleteRiskResponse) => {
                history.replace(ROUTE_RISKS_VIEW, {
                    notifications: [
                        {
                            id: uuidv4(),
                            type: 'success',
                            header: `Delete Risk ${risk?.name} Succeeded.`,
                            dismissible: true,
                        },
                    ],
                });
            },
            onError: (error: Error, params: DeleteRiskParams) => {
                addNotification({
                    id: uuidv4(),
                    type: 'error',
                    header: `Delete Risk ${risk?.name} Failed.`,
                    content: error.message,
                    dismissible: true,
                });
            },
        }
    );

    const onConfirmDelete = () => {
        console.log(`confirm delete ${risk?.name}`);
        if (risk) {
            mutation.mutate({ id: risk?.id });
        }
    };

    const ActionButtons = useMemo(() => {
        const path = generatePath(ROUTE_RISK_UPDATE, {
            riskId: riskId,
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
    }, [history, riskId]);

    if (!isLoadingControlObjective && isErrorControlObjective) {
        const op = (prevMessage: string, error?: Error) => {
            return `${prevMessage}${prevMessage.length !== 0 ? '\n' : ''}${
                error?.message
            }`;
        };
        const message = errorsControlObjective.reduce(op, '');
        return (
            <PageError
                header="Error occurs on loading Control Objectives"
                message={message}
            />
        );
    }

    return (
        <QueryContainerTemplate
            loading={isLoading || isLoadingControlObjective}
            error={isError && error ? error : undefined}
            data={risk}
        >
            {(risk) => (
                <Stack>
                    <HeadingStripe
                        title={risk?.name ?? ''}
                        actionButtons={ActionButtons}
                    />
                    <RiskDetailComponent risk={mockRisk} />
                    <ControlObjectiveTable
                        controlObjectives={controlObjectives}
                        disableCreate={true}
                        disableRowSelect={true}
                        disableToolbar={true}
                        disableDelete={true}
                        tableName={`Mitigated by ${
                            controlObjectives.length
                        } Control Objective${controlObjectives.length > 1 ? 's' : ''}`}
                    />
                    <RiskTargetEntities />
                    <RiskDeleteConfirmationModal
                        riskName={risk.name}
                        visible={showDeleteConfirmation}
                        setVisible={setShowDeleteConfirmation}
                        onConfirmed={onConfirmDelete}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default RiskDetail;
