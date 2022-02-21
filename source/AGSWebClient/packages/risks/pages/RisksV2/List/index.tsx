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
import { FunctionComponent, useState, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocation } from 'react-router-dom';

import Stack from 'aws-northstar/layouts/Stack';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import QueryContainerTemplate from '@ags/webclient-core//components/QueryContainerTemplate';
import {
    RiskSummaryV2,
    DeleteRiskParams,
    DeleteRiskResponse,
} from '@ags/webclient-risks-core/types';
import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import DeleteConfirmationModal from '@ags/webclient-risks-view/components/Risks/DeleteConfirmationModal';
import RisksTable from '@ags/webclient-risks-view/components/RisksV2/Table';
import RiskSearch, {
    RiskSearchData,
} from '@ags/webclient-risks-view/components/RisksV2/Search';

const mockRisks: RiskSummaryV2[] = [
    {
        category: 'CYBERSECURITY',
        description: 'Accidental public exposure of data and artifacts',
        id: '50256ce7-dba5-4eb0-9a65-142740c0966e',
        name: 'Accidental public exposure of data and artifacts',
        countTargetEntities: 2,
        countControlObjectivies: 3,
        mitigationStatus: 'MITIGATED',
    },
    {
        category: 'GENERAL',
        description: 'Inappropriate disclosure or theft of data',
        id: '34e05794-1610-4488-b824-8eb39e95bc03',
        name: 'Inappropriate disclosure or theft of data',
        countTargetEntities: 2,
        countControlObjectivies: 0,
        mitigationStatus: 'ACCEPTED_WITHOUT_MITIGATION',
    },
];

const RisksView: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();
    const location = useLocation();
    const [initialSearchData, setInitialSearchData] = useState<RiskSearchData>();

    const query = useMemo(() => {
        return new URLSearchParams(location.search);
    }, [location]);

    useEffect(() => {
        const category = query.get('category');
        const entityId = query.get('entityId');
        const status = query.get('status');
        const entityType = query.get('entityType');
        const impactType = query.get('impactType');
        const impactSeverity = query.get('severity');
        const impactLikelihood = query.get('likelihood');
        setInitialSearchData({
            ...(category && { category }),
            ...(status && { status }),
            ...(entityId && { entityId }),
            ...(entityType && { entityType }),
            ...(impactType && { impactType }),
            ...(impactSeverity && { impactSeverity }),
            ...(impactLikelihood && { impactLikelihood }),
        });
    }, [query]);

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [RiskToBeDeleted, setRiskToBeDeleted] = useState<RiskSummaryV2>();

    // load risks
    const { isLoading, data, isError, error } = useAgsListQuery<RiskSummaryV2>(
        QueryType.LIST_RISKS
    );

    const mutation = useAgsMutation<DeleteRiskResponse, DeleteRiskParams, Error>(
        MutationType.DELETE_RISK,
        {
            onSuccess: (data: DeleteRiskResponse) => {
                setIsDeleting(false);
                setShowDeleteConfirmation(false);
                addNotification({
                    id: uuidv4(),
                    type: 'success',
                    header: `Delete Risk ${RiskToBeDeleted?.name} Succeeded.`,
                    dismissible: true,
                });

                setRiskToBeDeleted(undefined);
            },
            onError: (error: Error, params: DeleteRiskParams) => {
                setIsDeleting(false);
                setShowDeleteConfirmation(false);
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

    const onDelete = (selectedRisks: RiskSummaryV2[]) => {
        setRiskToBeDeleted(selectedRisks[0]);
        setShowDeleteConfirmation(true);
    };

    const onConfirmDelete = () => {
        setIsDeleting(true);
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
            {() => {
                return (
                    <Stack>
                        <RiskSearch
                            initialSearchData={initialSearchData}
                            onSearch={console.log}
                        />
                        <RisksTable
                            risks={mockRisks}
                            disableRowSelect={false}
                            onDeleteRisk={onDelete}
                            disableToolbar={true}
                        />
                        <DeleteConfirmationModal
                            riskName={RiskToBeDeleted?.name ?? ''}
                            visible={showDeleteConfirmation}
                            setVisible={setShowDeleteConfirmation}
                            onConfirmed={onConfirmDelete}
                            isDeleting={isDeleting}
                        />
                    </Stack>
                );
            }}
        </QueryContainerTemplate>
    );
};

export default RisksView;
