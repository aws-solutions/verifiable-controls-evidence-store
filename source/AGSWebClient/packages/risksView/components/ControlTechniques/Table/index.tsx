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
import Table from 'aws-northstar/components/Table';
import Link from 'aws-northstar/components/Link';
import Button from 'aws-northstar/components/Button';
import Inline from 'aws-northstar/layouts/Inline';
import { ControlTechniqueSummary } from '@ags/webclient-risks-core/types';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import {
    ROUTE_CONTROL_TECHNIQUE_CREATE,
    ROUTE_CONTROL_TECHNIQUE_DETAILS,
    ROUTE_CONTROL_TECHNIQUE_UPDATE,
} from '@ags/webclient-risks-core/config/routes';
import { PERMISSION_CONTROL_MANAGE } from '@ags/webclient-risks-core/config/permissions';

export interface ControlTechniqueTableProps {
    controlTechniques?: ControlTechniqueSummary[];
    disableRowSelect?: boolean;
    disableToolbar?: boolean;
    disableCreate?: boolean;
    disableDelete?: boolean;
    tableName?: string;
    onDeleteControlTechnique?: (
        selectedControlTechniques: ControlTechniqueSummary[]
    ) => void;
}

export const getColumnDefinitions = () => {
    const fields: any[] = [
        {
            id: 'name',
            width: 300,
            Header: 'Name',
            accessor: 'name',
            Cell: ({ row }: any) => {
                return (
                    <Link
                        href={generatePath(ROUTE_CONTROL_TECHNIQUE_DETAILS, {
                            controlTechniqueId: row.original.id,
                        })}
                    >
                        {row.original.name}
                    </Link>
                );
            },
        },
        {
            id: 'controlType',
            width: 200,
            Header: 'Control Type',
            accessor: 'controlType',
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

const ControlTechniqueTable: FunctionComponent<ControlTechniqueTableProps> = ({
    controlTechniques = [],
    disableRowSelect = true,
    disableToolbar = false,
    disableCreate = false,
    disableDelete = false,
    tableName,
    onDeleteControlTechnique = () => {},
}) => {
    const history = useHistory();
    const [selectedControlTechniques, setSelectedControlTechniques] = useState<
        ControlTechniqueSummary[]
    >([]);
    const columnDefinitions = useMemo(() => getColumnDefinitions(), []);

    const controlTechniqueTableActions = useMemo(() => {
        const pathUpdate = selectedControlTechniques[0]?.id
            ? generatePath(ROUTE_CONTROL_TECHNIQUE_UPDATE, {
                  controlTechniqueId: selectedControlTechniques[0].id,
              })
            : '';

        return (
            <Inline>
                {!disableRowSelect && (
                    <HasGroups groups={PERMISSION_CONTROL_MANAGE}>
                        <Button
                            disabled={selectedControlTechniques.length !== 1}
                            onClick={() => {
                                history.push(pathUpdate);
                            }}
                        >
                            Update
                        </Button>
                    </HasGroups>
                )}
                {!disableRowSelect && !disableDelete && (
                    <HasGroups groups={PERMISSION_CONTROL_MANAGE}>
                        <Button
                            disabled={selectedControlTechniques.length !== 1}
                            onClick={() => {
                                onDeleteControlTechnique(selectedControlTechniques);
                            }}
                        >
                            Delete
                        </Button>
                    </HasGroups>
                )}
                {!disableCreate && (
                    <HasGroups groups={PERMISSION_CONTROL_MANAGE}>
                        <Button
                            variant="primary"
                            onClick={() => {
                                history.push(ROUTE_CONTROL_TECHNIQUE_CREATE);
                            }}
                        >
                            Add new Control Technique
                        </Button>
                    </HasGroups>
                )}
            </Inline>
        );
    }, [
        selectedControlTechniques,
        disableRowSelect,
        disableDelete,
        disableCreate,
        history,
        onDeleteControlTechnique,
    ]);

    const getRowId = useCallback((data) => data.id, []);
    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={tableName || `Control Techniques (${controlTechniques.length})`}
            disableRowSelect={disableRowSelect}
            multiSelect={false}
            actionGroup={controlTechniqueTableActions}
            onSelectionChange={setSelectedControlTechniques}
            getRowId={getRowId}
            items={controlTechniques}
            disableSettings={disableToolbar}
            disableFilters={disableToolbar}
            disablePagination={disableToolbar}
        />
    );
};

export default ControlTechniqueTable;
