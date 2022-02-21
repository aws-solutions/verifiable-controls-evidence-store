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
import Box from 'aws-northstar/layouts/Box';
import Table, { Column } from 'aws-northstar/components/Table';

import { CompliancePosture } from '@ags/webclient-compliance-core/types';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import { Estate } from '@ags/webclient-estates-core/types';
import { Application } from '@ags/webclient-applications-core/types';
import ComplianceStatus from '../ComplianceStatus';

export interface DeploymentListProps {
    data: CompliancePosture[];
    tableTitle: string;
    type: 'RUNTIME' | 'DEPLOY';
    businessUnits: { [id: string]: BusinessUnitSummary };
    estates: { [id: string]: Estate };
    applications: { [id: string]: Application };
}

const DeploymentList: FunctionComponent<DeploymentListProps> = ({
    data,
    tableTitle,
    type,
    businessUnits,
    estates,
    applications,
}) => {
    const columnDefinition: Column<CompliancePosture>[] = useMemo(() => {
        const columns: Column<CompliancePosture>[] = [
            {
                id: 'businessId',
                width: 200,
                Header: 'Business Unit',
                accessor: (data) =>
                    businessUnits[data.businessUnitId]?.name || data.businessUnitId,
            },
            {
                id: 'estateId',
                width: 200,
                Header: 'Estate',
                accessor: (data) => estates[data.estateId]?.name || data.estateId,
            },
            {
                id: 'applicationId',
                width: 200,
                Header: 'Application',
                accessor: (data) =>
                    applications[data.applicationId]?.name || data.applicationId,
            },
            {
                id: 'environmentId',
                width: 100,
                Header: 'Environment',
                accessor: (data) => {
                    const estate = estates[data.estateId];
                    if (estate) {
                        const environment = estate.environments?.find(
                            (e) => e.id === data.environmentId
                        );
                        if (environment) {
                            return environment.name;
                        }
                    }
                    return data.environmentId;
                },
            },
            {
                id: 'releaseId',
                width: 360,
                Header: 'Release',
                accessor: 'releaseId',
            },
            {
                id: 'deploymentId',
                width: 320,
                Header: 'Deployment',
                accessor: 'deploymentId',
            },
        ];

        if (type === 'RUNTIME') {
            return [
                ...columns,
                {
                    id: 'runtimeStatus',
                    width: 150,
                    Header: 'Runtime Status',
                    accessor: (data) => data.runtimeStatus,
                    Cell: ({ value }: any) => {
                        return <ComplianceStatus status={value} />;
                    },
                },
            ];
        }

        return [
            ...columns,
            {
                id: 'deploymentStatus',
                width: 150,
                Header: 'Deployment Status',
                accessor: (data) => data.deploymentStatus,
                Cell: ({ row }: any) => {
                    return <ComplianceStatus status={row.original.deploymentStatus} />;
                },
            },
            {
                id: 'runtimeStatus',
                width: 150,
                Header: 'Runtime Status',
                accessor: (data) => data.runtimeStatus,
                Cell: ({ value }: any) => {
                    return <ComplianceStatus status={value} />;
                },
            },
        ];
    }, [type, applications, businessUnits, estates]);

    return (
        <Box width="100%">
            <Table
                tableTitle={tableTitle}
                items={data}
                disableRowSelect={true}
                disableSettings={true}
                defaultPageSize={5}
                columnDefinitions={columnDefinition}
            />
        </Box>
    );
};

export default DeploymentList;
