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
import { FunctionComponent } from 'react';
import Table, { Column, FetchDataOptions } from 'aws-northstar/components/Table';
import { formatDate } from '@ags/webclient-core/utils/helpers';
import Link from 'aws-northstar/components/Link';
import { generatePath } from 'react-router-dom';
import {
    ROUTE_EVIDENCE_DETAIL,
    ROUTE_EVIDENCE_PROVIDER_DETAILS,
    ROUTE_SCHEMA_DETAILS,
} from '@ags/webclient-evidence-core/config/routes';
import { Evidence } from '@ags/webclient-evidence-core/types';

interface EvidencesTableProps {
    evidences?: Evidence[];
    total?: number;
    onFetchData?: (options: FetchDataOptions) => void;
    isLoading?: boolean;
}

const columnDefinitions: Column<Evidence>[] = [
    {
        id: 'evidenceId',
        width: 200,
        Header: 'Id',
        accessor: 'evidenceId',
        Cell: ({ row }: any) => {
            if (row.original) {
                return (
                    <Link
                        href={generatePath(ROUTE_EVIDENCE_DETAIL, {
                            evidenceId: row.original.evidenceId,
                        })}
                    >
                        {row.original.evidenceId}
                    </Link>
                );
            }
        },
    },
    {
        id: 'authorityName',
        width: 200,
        Header: 'Provider',
        accessor: 'providerName',
        Cell: ({ row }: any) => {
            if (row.original) {
                return (
                    <Link
                        href={generatePath(ROUTE_EVIDENCE_PROVIDER_DETAILS, {
                            providerId: row.original.providerId,
                        })}
                    >
                        {row.original.providerName ?? row.original.providerId}
                    </Link>
                );
            }
        },
    },
    {
        id: 'schemaId',
        width: 300,
        Header: 'Evidence type',
        accessor: 'schemaId',
        Cell: ({ row }: any) => {
            if (row.original) {
                return (
                    <Link
                        href={generatePath(ROUTE_SCHEMA_DETAILS, {
                            providerId: row.original.providerId,
                            schemaId: row.original.schemaId,
                        })}
                    >
                        {row.original.schemaId}
                    </Link>
                );
            }
        },
    },
    {
        id: 'targetId',
        width: 300,
        Header: 'Target Id',
        accessor: 'targetId',
    },
    {
        id: 'additionalTargets',
        width: 300,
        Header: 'Additional Target Ids',
        accessor: 'additionalTargetIds',
        Cell: ({ row }: any) => {
            if (row.original?.additionalTargetIds) {
                return row.original.additionalTargetIds.join(', ');
            }
            return '';
        },
    },
    {
        id: 'createdTimestamp',
        width: 150,
        Header: 'Created At',
        Cell: ({ row }: any) => {
            return formatDate(new Date(row.original?.createdTimestamp));
        },
    },
];
const EvidencesTable: FunctionComponent<EvidencesTableProps> = ({
    evidences = [],
    total,
    onFetchData,
    isLoading,
}) => {
    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={`Evidence (${total})`}
            items={evidences}
            multiSelect={false}
            sortBy={[{ id: 'createdTimestamp', desc: true }]}
            rowCount={total}
            disableSettings={false}
            pageSizes={[]}
            disableFilters={true}
            onFetchData={onFetchData}
            defaultPageSize={20}
            disableSortBy={true}
            loading={isLoading}
            disableRowSelect={true}
        />
    );
};

export default EvidencesTable;
