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
import { FunctionComponent, useMemo, useCallback } from 'react';

import Table, { Column } from 'aws-northstar/components/Table';
import { Artifact } from '@ags/webclient-application-release-core/types';

export interface ArtifactTableProps {
    artifacts?: Artifact[];
    disableRowSelect?: boolean;
    disableToolbar?: boolean;
    disableCreate?: boolean;
    disableDelete?: boolean;
    tableName?: string;
}

export const getColumnDefinitions = () => {
    const fields: Column<Artifact>[] = [
        {
            id: 'name',
            width: 400,
            Header: 'Name',
            accessor: 'artifactName',
        },
        {
            id: 'version',
            width: 400,
            Header: 'Version',
            accessor: 'artifactVersion',
        },
    ];

    return fields;
};

const ArtifactTable: FunctionComponent<ArtifactTableProps> = ({
    artifacts = [],
    disableRowSelect = true,
    disableToolbar = true,
    tableName,
}) => {
    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions();
    }, []);

    const getRowId = useCallback((data) => data.artifactName, []);
    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={tableName || `Artifacts (${artifacts.length})`}
            disableRowSelect={disableRowSelect}
            multiSelect={false}
            getRowId={getRowId}
            items={artifacts}
            disableSettings={disableToolbar}
            disableFilters={disableToolbar}
            disablePagination={disableToolbar}
            sortBy={[{ id: 'name' }]}
        />
    );
};

export default ArtifactTable;
