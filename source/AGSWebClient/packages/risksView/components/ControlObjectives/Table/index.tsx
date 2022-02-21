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
import { generatePath, useHistory } from 'react-router-dom';
import isEqual from 'lodash.isequal';

import Table from 'aws-northstar/components/Table';
import Link from 'aws-northstar/components/Link';
import Button from 'aws-northstar/components/Button';
import Inline from 'aws-northstar/layouts/Inline';

import HasGroups from '@ags/webclient-core/components/HasGroups';

import { ControlObjectiveSummary } from '@ags/webclient-risks-core/types';
import {
    ROUTE_CONTROL_OBJECTIVE_CREATE,
    ROUTE_CONTROL_OBJECTIVE_DETAILS,
    ROUTE_CONTROL_OBJECTIVE_UPDATE,
} from '@ags/webclient-risks-core/config/routes';
import { PERMISSION_RISK_MANAGE } from '@ags/webclient-risks-core/config/permissions';

export interface ControlObjectiveTableProps {
    controlObjectives?: ControlObjectiveSummary[];
    disableRowSelect?: boolean;
    disableToolbar?: boolean;
    disableCreate?: boolean;
    disableDelete?: boolean;
    tableName?: string;
    OnDeleteControlObjective?: (
        selectedControlObjectives: ControlObjectiveSummary[]
    ) => void;
}

export const getColumnDefinitions = () => {
    const fields: any[] = [
        {
            id: 'name',
            width: 400,
            Header: 'Name',
            accessor: 'name',
            Cell: ({ row }: any) => {
                return (
                    <Link
                        href={generatePath(ROUTE_CONTROL_OBJECTIVE_DETAILS, {
                            controlObjectiveId: row.original.id,
                        })}
                    >
                        {row.original.name}
                    </Link>
                );
            },
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

const ControlObjectiveTable: FunctionComponent<ControlObjectiveTableProps> = ({
    controlObjectives = [],
    disableRowSelect = true,
    disableToolbar = false,
    disableCreate = false,
    disableDelete = false,
    tableName,
    OnDeleteControlObjective = () => {},
}) => {
    const history = useHistory();

    const [selectedControlObjectives, setSelectedControlObjectives] = useState<
        ControlObjectiveSummary[]
    >([]);

    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions();
    }, []);

    const tableActions = useMemo(() => {
        const pathUpdate = selectedControlObjectives[0]?.id
            ? generatePath(ROUTE_CONTROL_OBJECTIVE_UPDATE, {
                  controlObjectiveId: selectedControlObjectives[0].id,
              })
            : '';
        return (
            <Inline>
                {!disableRowSelect && (
                    <HasGroups groups={PERMISSION_RISK_MANAGE}>
                        <Button
                            disabled={selectedControlObjectives.length !== 1}
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
                            disabled={selectedControlObjectives.length !== 1}
                            onClick={() => {
                                OnDeleteControlObjective(selectedControlObjectives);
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
                                history.push(ROUTE_CONTROL_OBJECTIVE_CREATE);
                            }}
                        >
                            Add new Control Objective
                        </Button>
                    </HasGroups>
                )}
            </Inline>
        );
    }, [
        selectedControlObjectives,
        history,
        disableRowSelect,
        OnDeleteControlObjective,
        disableCreate,
        disableDelete,
    ]);

    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={tableName || `ControlObjectives (${controlObjectives.length})`}
            disableRowSelect={disableRowSelect}
            multiSelect={false}
            actionGroup={tableActions}
            onSelectionChange={(selectedItems) => {
                if (!isEqual(selectedControlObjectives, selectedItems)) {
                    setSelectedControlObjectives(selectedItems);
                }
            }}
            getRowId={(data) => data.id}
            items={controlObjectives}
            disableSettings={disableToolbar}
            disableFilters={disableToolbar}
            disablePagination={disableToolbar}
        />
    );
};

export default ControlObjectiveTable;
