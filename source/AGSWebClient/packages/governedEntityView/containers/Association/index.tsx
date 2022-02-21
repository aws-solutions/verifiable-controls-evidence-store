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
import { FunctionComponent, useMemo, useCallback, useState } from 'react';
import Inline from 'aws-northstar/layouts/Inline';
import Container from 'aws-northstar/layouts/Container';
import Table, { Column } from 'aws-northstar/components/Table';
import Button from 'aws-northstar/components/Button';
import Tabs from 'aws-northstar/components/Tabs';
import { RiskSummary, ControlObjectiveSummary } from '@ags/webclient-risks-core/types';
import {
    GovernedEntityAssociation,
    UpdateGovernedEntityAssociationParams,
    UpdateGovernedEntityAssociationResponse,
} from '@ags/webclient-governed-entity-core/types';

import {
    useAgsQuery,
    useAgsListQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';

import { QueryType, MutationType } from '@ags/webclient-governed-entity-core/queries';

import { QueryType as RisksQueryType } from '@ags/webclient-risks-core/queries';

import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';
import isEqual from 'lodash.isequal';

export interface GovernedEntityAssociationViewProps {
    entityType: string;
    entityId: string;
    onUpdateSuccess?: (data: UpdateGovernedEntityAssociationResponse) => void;
    onUpdateFailure?: (error: any, params: UpdateGovernedEntityAssociationParams) => void;
}

const isSame = <T extends string>(a: Array<T>, b: Array<T>) => {
    if (a.length === b.length) {
        if (a.length > 0) {
            const tempA = a.slice().sort();
            const tempB = b.slice().sort();
            return isEqual(tempA, tempB);
        } else {
            return true;
        }
    }
    return false;
};

const columnDefinitions = [
    {
        id: 'name',
        width: 400,
        Header: 'Name',
        accessor: 'name',
    },
    {
        id: 'description',
        width: 500,
        Header: 'Description',
        accessor: 'description',
    },
];

const GovernedEntityAssociationView: FunctionComponent<GovernedEntityAssociationViewProps> =
    ({ entityType, entityId, onUpdateSuccess, onUpdateFailure }) => {
        // query
        const {
            isLoading,
            isError,
            data: associations,
        } = useAgsQuery<GovernedEntityAssociation>(
            QueryType.GET_GOVERNED_ENTITY_ASSOCIATION,
            entityType,
            entityId
        );

        const {
            isLoading: isLoadingRisks,
            isError: isErrorRisks,
            data: risks,
        } = useAgsListQuery<RiskSummary>(RisksQueryType.LIST_RISKS);

        const {
            isLoading: isLoadingControlObjectives,
            isError: isErrorControlObjectives,
            data: controlObjectives,
        } = useAgsListQuery<ControlObjectiveSummary>(
            RisksQueryType.LIST_ALL_CONTROLOBJECTIVES
        );

        // mutations
        const mutation = useAgsMutation<
            UpdateGovernedEntityAssociationResponse,
            UpdateGovernedEntityAssociationParams,
            Error
        >(MutationType.UPDATE_GOVERNED_ENTITY_ASSOCIATION, {
            onSuccess: (data: UpdateGovernedEntityAssociationResponse) => {
                console.log('association saved.');
                onUpdateSuccess && onUpdateSuccess(data);
            },
            onError: (error: Error, params: UpdateGovernedEntityAssociationParams) => {
                console.log('association failed to save.');
                onUpdateFailure && onUpdateFailure(error, params);
            },
        });

        // tables
        const [selectedRisks, setSelectedRisks] = useState(associations?.riskIds ?? []);
        const [selectedControlObjectives, setSelectedControlObjectives] = useState(
            associations?.controlObjectiveIds ?? []
        );

        const getRowId = useCallback((data) => data.id, []);
        const riskTable = useMemo(() => {
            return (
                <Table
                    columnDefinitions={columnDefinitions as Column<RiskSummary>[]}
                    items={risks}
                    loading={isLoadingRisks}
                    getRowId={getRowId}
                    selectedRowIds={associations?.riskIds}
                    onSelectionChange={(selectedItems: RiskSummary[]) => {
                        setSelectedRisks(selectedItems?.map(({ id }) => id));
                    }}
                />
            );
        }, [risks, isLoadingRisks, getRowId, associations]);

        const controlObjectiveTable = useMemo(
            () => (
                <Table
                    columnDefinitions={
                        columnDefinitions as Column<ControlObjectiveSummary>[]
                    }
                    items={controlObjectives}
                    loading={isLoadingControlObjectives}
                    getRowId={getRowId}
                    selectedRowIds={associations?.controlObjectiveIds}
                    onSelectionChange={(selectedItems: ControlObjectiveSummary[]) => {
                        setSelectedControlObjectives(selectedItems?.map(({ id }) => id));
                    }}
                />
            ),
            [controlObjectives, isLoadingControlObjectives, getRowId, associations]
        );

        const tabs = useMemo(
            () => [
                {
                    label: 'Risks',
                    id: 'risk',
                    content: riskTable,
                },
                {
                    label: 'Control Objectives',
                    id: 'controlObjective',
                    content: controlObjectiveTable,
                },
            ],
            [riskTable, controlObjectiveTable]
        );

        // save button
        const disableSaveButton = useMemo(() => {
            return (
                mutation.isLoading ||
                isLoading ||
                (isSame(selectedRisks, associations?.riskIds ?? []) &&
                    isSame(
                        selectedControlObjectives,
                        associations?.controlObjectiveIds ?? []
                    ))
            );
        }, [
            mutation.isLoading,
            isLoading,
            selectedRisks,
            associations,
            selectedControlObjectives,
        ]);

        const handleSave = useCallback(() => {
            const request = {
                entityType,
                entityId,
                riskToAssociateIds: selectedRisks.filter(
                    (riskId) => !(associations?.riskIds ?? []).includes(riskId)
                ),
                controlObjectiveToAssociateIds: selectedControlObjectives.filter(
                    (controlObjectiveId) =>
                        !(associations?.controlObjectiveIds ?? []).includes(
                            controlObjectiveId
                        )
                ),
                riskToDisassociateIds: (associations?.riskIds ?? []).filter(
                    (riskId) => !selectedRisks.includes(riskId)
                ),
                controlObjectiveToDisassociateIds: (
                    associations?.controlObjectiveIds ?? []
                ).filter(
                    (controlObjectiveId) =>
                        !selectedControlObjectives.includes(controlObjectiveId)
                ),
            };
            mutation.mutate(request);
        }, [
            entityType,
            entityId,
            selectedRisks,
            selectedControlObjectives,
            associations,
            mutation,
        ]);

        const actions = useMemo(
            () => (
                <Inline>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={disableSaveButton}
                    >
                        Save
                    </Button>
                </Inline>
            ),
            [disableSaveButton, handleSave]
        );

        // page
        if (isLoading || isLoadingRisks || isLoadingControlObjectives) {
            return <PageLoading />;
        }

        if (isError || isErrorRisks || isErrorControlObjectives) {
            return <PageError message="Failed to load governed entity associations." />;
        }

        return (
            <Container
                title="Associated Risk and Control Objectives"
                subtitle="Select the associated risks and control objectives and click Save to update"
                actionGroup={actions}
            >
                <Tabs tabs={tabs} variant="default" />
            </Container>
        );
    };

export default GovernedEntityAssociationView;
