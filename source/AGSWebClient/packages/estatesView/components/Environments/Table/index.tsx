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
import { FunctionComponent, useMemo } from 'react';
import { formatDate } from '@ags/webclient-core/utils/helpers';
import Table from 'aws-northstar/components/Table';
import { Environment } from '@ags/webclient-estates-core/types';

export interface EnvironmentsTableProps {
    environments?: Array<Environment>;
}

const getColumnDefinitions = () => {
    const columnDefinitions: any[] = [
        {
            id: 'name',
            width: 150,
            Header: 'Name',
            accessor: 'name',
        },
        {
            id: 'awsAccountId',
            width: 200,
            Header: 'AWS Account Number',
            accessor: 'awsAccountId',
        },
        {
            id: 'envClass',
            width: 150,
            Header: 'Env Class',
            accessor: 'envClasses',
        },
        {
            id: 'mandatory',
            width: 150,
            Header: 'Mandatory',
            accessor: 'mandatory',
            Cell: ({ row }: any) => {
                if (row && row.original) {
                    return row.original.mandatory ? 'Yes' : 'No';
                }
            },
        },
        {
            id: 'isManualApprovalRequired',
            width: 200,
            Header: 'Manual Approval Required',
            accessor: 'isManualApprovalRequired',
            Cell: ({ row }: any) => {
                if (row && row.original) {
                    return row.original.isManualApprovalRequired ? 'Yes' : 'No';
                }
            },
        },
    ];

    columnDefinitions.push(
        {
            id: 'creationTime',
            width: 150,
            Header: 'Created At',
            accessor: 'creationTime',
            Cell: ({ row }: any) => formatDate(new Date(row.original.creationTime)),
        },
        {
            id: 'lastUpdatedTime',
            width: 150,
            Header: 'Last Updated At',
            accessor: 'lastUpdatedTime',
            Cell: ({ row }: any) => formatDate(new Date(row.original.lastUpdatedTime)),
        }
    );

    return columnDefinitions;
};

const EnvironmentsTable: FunctionComponent<EnvironmentsTableProps> = ({
    environments = [],
}) => {
    const columnsDefinitions = useMemo(() => {
        return getColumnDefinitions();
    }, []);

    return (
        <Table
            columnDefinitions={columnsDefinitions}
            tableTitle={`Environments (${environments.length})`}
            items={environments}
            multiSelect={false}
        />
    );
};

export default EnvironmentsTable;
