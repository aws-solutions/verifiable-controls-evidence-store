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
import Link from 'aws-northstar/components/Link';
import { ReleaseCandidate } from '@ags/webclient-application-release-core/types';
import { formatDate } from '@ags/webclient-core/utils/helpers';

export interface ReleaseCandidateTableProps {
    releaseCandidates?: ReleaseCandidate[];
    disableRowSelect?: boolean;
    disableToolbar?: boolean;
    disableCreate?: boolean;
    disableDelete?: boolean;
    tableName?: string;
}

export const getColumnDefinitions = () => {
    const fields: Column<ReleaseCandidate>[] = [
        {
            id: 'id',
            width: 400,
            Header: 'Id',
            accessor: 'releaseCandidateId',
            Cell: ({ row }: any) => {
                return (
                    <Link
                        href={`/applications/${row.original.applicationId}/${row.original.releaseCandidateId}`}
                    >
                        {row.original.releaseCandidateId}
                    </Link>
                );
            },
        },
        {
            id: 'commitId',
            width: 400,
            Header: 'Commit Id',
            accessor: 'commitId',
        },
        {
            id: 'creationTime',
            width: 300,
            Header: 'Create Time',
            accessor: 'creationTime',
            Cell: ({ row }: any) => formatDate(new Date(row.original.creationTime)),
        },
    ];

    return fields;
};

const ReleaseCandidateTable: FunctionComponent<ReleaseCandidateTableProps> = ({
    releaseCandidates = [],
    disableRowSelect = true,
    disableToolbar = false,
    tableName,
}) => {
    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions();
    }, []);

    const getRowId = useCallback((data) => data.releaseCandidateId, []);
    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={tableName || `Release Candidates (${releaseCandidates.length})`}
            disableRowSelect={disableRowSelect}
            multiSelect={false}
            getRowId={getRowId}
            items={releaseCandidates}
            disableSettings={disableToolbar}
            disableFilters={disableToolbar}
            disablePagination={disableToolbar}
            sortBy={[{ id: 'creationTime', desc: true }]}
        />
    );
};

export default ReleaseCandidateTable;
