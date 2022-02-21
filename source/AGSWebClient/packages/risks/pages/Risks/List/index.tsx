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

import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import {
    RiskSummary,
    DeleteRiskParams,
    DeleteRiskResponse,
} from '@ags/webclient-risks-core/types';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';

import RiskeDeleteConfirmationModal from '@ags/webclient-risks-view/components/Risks/DeleteConfirmationModal';
import RisksTable from '@ags/webclient-risks-view/components/Risks/Table';

const RisksView: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [RiskToBeDeleted, setRiskToBeDeleted] = useState<RiskSummary>();

    // load risks
    const { isLoading, data, isError, error } = useAgsListQuery<RiskSummary>(
        QueryType.LIST_RISKS
    );

    const mutation = useAgsMutation<DeleteRiskResponse, DeleteRiskParams, Error>(
        MutationType.DELETE_RISK,
        {
            onSuccess: (data: DeleteRiskResponse) => {
                addNotification({
                    id: uuidv4(),
                    type: 'success',
                    header: `Delete Risk ${RiskToBeDeleted?.name} Succeeded.`,
                    dismissible: true,
                });

                setRiskToBeDeleted(undefined);
            },
            onError: (error: Error, params: DeleteRiskParams) => {
                addNotification({
                    id: uuidv4(),
                    type: 'error',
                    header: `Delete Risk ${RiskToBeDeleted?.name} Failed.`,
                    content: error.message,
                    dismissible: true,
                });
            },
        }
    );

    const onDelete = (selectedRisks: RiskSummary[]) => {
        console.log('delete ' + selectedRisks[0].name);
        setRiskToBeDeleted(selectedRisks[0]);
        setShowDeleteConfirmation(true);
    };

    const onConfirmDelete = () => {
        console.log(`confirm delete ${RiskToBeDeleted?.name}`);
        if (RiskToBeDeleted) {
            mutation.mutate({ id: RiskToBeDeleted.id });
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
                        <RisksTable
                            risks={data}
                            disableRowSelect={false}
                            onDeleteRisk={onDelete}
                        />
                        <RiskeDeleteConfirmationModal
                            riskName={RiskToBeDeleted?.name ?? ''}
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

export default RisksView;
