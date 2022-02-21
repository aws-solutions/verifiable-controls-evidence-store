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
import { FunctionComponent, useMemo, useState, useCallback } from 'react';
import { generatePath, useHistory } from 'react-router-dom';
import isEqual from 'lodash.isequal';

import Table, { Column } from 'aws-northstar/components/Table';
import Link from 'aws-northstar/components/Link';
import Button from 'aws-northstar/components/Button';
import Inline from 'aws-northstar/layouts/Inline';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import { RiskSummary } from '@ags/webclient-risks-core/types';
import {
    ROUTE_RISK_CREATE,
    ROUTE_RISK_DETAILS,
    ROUTE_RISK_UPDATE,
} from '@ags/webclient-risks-core/config/routes';
import { PERMISSION_RISK_MANAGE } from '@ags/webclient-risks-core/config/permissions';

export interface RiskTableProps {
    risks?: RiskSummary[];
    disableRowSelect?: boolean;
    disableToolbar?: boolean;
    disableCreate?: boolean;
    disableDelete?: boolean;
    tableName?: string;
    onDeleteRisk?: (selectedRisks: RiskSummary[]) => void;
}

export const getColumnDefinitions = () => {
    const fields: Column<RiskSummary>[] = [
        {
            id: 'name',
            width: 400,
            Header: 'Name',
            accessor: 'name',
            Cell: ({ row }: any) => {
                return (
                    <Link
                        href={generatePath(ROUTE_RISK_DETAILS, {
                            riskId: row.original.id,
                        })}
                    >
                        {row.original.name}
                    </Link>
                );
            },
        },
        {
            id: 'category',
            width: 200,
            Header: 'Category',
            accessor: 'category',
        },
        {
            id: 'description',
            width: 500,
            Header: 'Description',
            accessor: 'description',
        },
    ];

    return fields;
};

const RiskTable: FunctionComponent<RiskTableProps> = ({
    risks = [],
    disableRowSelect = true,
    disableToolbar = false,
    disableCreate = false,
    disableDelete = false,
    tableName,
    onDeleteRisk = () => {},
}) => {
    const history = useHistory();

    const [selectedRisks, setSelectedRisks] = useState<RiskSummary[]>([]);

    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions();
    }, []);

    const tableActions = useMemo(() => {
        const pathUpdate = selectedRisks[0]?.id
            ? generatePath(ROUTE_RISK_UPDATE, {
                  riskId: selectedRisks[0].id,
              })
            : '';
        return (
            <Inline>
                {!disableRowSelect && (
                    <HasGroups groups={PERMISSION_RISK_MANAGE}>
                        <Button
                            disabled={selectedRisks.length !== 1}
                            onClick={() => {
                                history.push(pathUpdate);
                            }}
                        >
                            Update
                        </Button>
                    </HasGroups>
                )}
                {!disableRowSelect && !disableDelete && (
                    <HasGroups groups={PERMISSION_RISK_MANAGE}>
                        <Button
                            disabled={selectedRisks.length !== 1}
                            onClick={() => {
                                onDeleteRisk(selectedRisks);
                            }}
                        >
                            Delete
                        </Button>
                    </HasGroups>
                )}
                {!disableCreate && (
                    <HasGroups groups={PERMISSION_RISK_MANAGE}>
                        <Button
                            variant="primary"
                            onClick={() => {
                                history.push(ROUTE_RISK_CREATE);
                            }}
                        >
                            Add new Risk
                        </Button>
                    </HasGroups>
                )}
            </Inline>
        );
    }, [
        selectedRisks,
        disableRowSelect,
        disableDelete,
        disableCreate,
        history,
        onDeleteRisk,
    ]);

    const getRowId = useCallback((data) => data.id, []);
    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={tableName || `Risks (${risks.length})`}
            disableRowSelect={disableRowSelect}
            multiSelect={false}
            actionGroup={tableActions}
            onSelectionChange={(selectedItems) => {
                if (!isEqual(selectedRisks, selectedItems)) {
                    setSelectedRisks(selectedItems);
                }
            }}
            getRowId={getRowId}
            items={risks}
            disableSettings={disableToolbar}
            disableFilters={disableToolbar}
            disablePagination={disableToolbar}
        />
    );
};

export default RiskTable;
