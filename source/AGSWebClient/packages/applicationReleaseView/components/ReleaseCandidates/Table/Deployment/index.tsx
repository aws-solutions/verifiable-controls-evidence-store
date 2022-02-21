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
import { Deployment } from '@ags/webclient-application-release-core/types';
import StatusIndicator from 'aws-northstar/components/StatusIndicator';
import { Estate } from '@ags/webclient-estates-core/types';
import { useLocation } from 'react-router-dom';
import HasService from '@ags/webclient-core/components/HasService';

export interface DeploymentTableProps {
    deployments?: Deployment[];
    estate?: Estate;
    disableRowSelect?: boolean;
    disableToolbar?: boolean;
    disableCreate?: boolean;
    disableDelete?: boolean;
    tableName?: string;
}

export function deploymentStatus(deployment: Deployment) {
    return deployment.state === 'Successful' ? (
        <StatusIndicator statusType="positive">{deployment.state}</StatusIndicator>
    ) : (
        <StatusIndicator statusType="info">
            {deployment.state || 'Unknown'}
        </StatusIndicator>
    );
}

export const getColumnDefinitions = (estate?: Estate, path?: string) => {
    const envName = (id: string | undefined) =>
        estate?.environments?.find((env) => env.id === id)?.name ?? id;
    const fields: Column<Deployment>[] = [
        {
            id: 'id',
            width: 300,
            Header: 'Deployment Id',
            accessor: 'deploymentId',
        },
        {
            id: 'environmentId',
            width: 200,
            Header: 'Environment',
            accessor: 'environmentId',
            Cell: ({ row }: any) => envName(row.original.environmentId),
        },
        {
            id: 'state',
            width: 200,
            Header: 'State',
            accessor: 'state',
            Cell: ({ row }: any) => deploymentStatus(row.original),
        },
        {
            id: 'action',
            width: 200,
            Header: 'Action',
            Cell: ({ row }: any) => {
                return (
                    <HasService service="AGSEvidenceStore">
                        <Link
                            href={`/evidences/?targetIds=${row.original.deploymentId}&returnUrl=${path}`}
                        >
                            View Evidence
                        </Link>
                    </HasService>
                );
            },
        },
    ];

    return fields;
};

const DeploymentTable: FunctionComponent<DeploymentTableProps> = ({
    deployments = [],
    estate,
    disableRowSelect = true,
    disableToolbar = true,
    tableName,
}) => {
    const location = useLocation();
    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions(estate, location.pathname);
    }, [estate, location.pathname]);

    const getRowId = useCallback((data) => data.deploymentId, []);

    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={tableName || `Deployments (${deployments.length})`}
            disableRowSelect={disableRowSelect}
            multiSelect={false}
            getRowId={getRowId}
            items={deployments}
            disableSettings={disableToolbar}
            disableFilters={disableToolbar}
            disablePagination={disableToolbar}
        />
    );
};

export default DeploymentTable;
