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
import { formatDate } from '@ags/webclient-core/utils/helpers';
import Table from 'aws-northstar/components/Table';
import Link from 'aws-northstar/components/Link';
import Button from 'aws-northstar/components/Button';
import Inline from 'aws-northstar/layouts/Inline';

import HasGroups from '@ags/webclient-core/components/HasGroups';

import { ApplicationSummary } from '@ags/webclient-application-release-core/types';
import {
    ROUTE_APPLICATION_CREATE,
    ROUTE_APPLICATION_UPDATE,
} from '@ags/webclient-application-release-core/config/routes';
import { PERMISSION_APPLICATION_MANAGE } from '@ags/webclient-application-release-core/config/permissions';
import PipelineStatus from '../PipelineProvisionStatus';

export interface ApplicationTableProps {
    applications?: ApplicationSummary[];
    disableRowSelect?: boolean;
    disableToolbar?: boolean;
    disableCreate?: boolean;
    disableDelete?: boolean;
    tableName?: string;
    OnDeleteApplication?: (selectedApplications: ApplicationSummary[]) => void;
}

export const getColumnDefinitions = () => {
    const fields: any[] = [
        {
            id: 'name',
            width: 250,
            Header: 'Name',
            accessor: 'name',
            Cell: ({ row }: any) => (
                <Link href={`/applications/${row.original.name}`}>
                    {row.original.name}
                </Link>
            ),
        },
        {
            id: 'description',
            width: 350,
            Header: 'Description',
            accessor: 'description',
        },
        {
            id: 'pipelineProvisionStatus',
            width: 150,
            Header: 'Pipeline Status',
            accessor: 'pipelineProvisionStatus',
            Cell: ({ row }: any) => (
                <PipelineStatus status={row.original.pipelineProvisionStatus} />
            ),
        },
        {
            id: 'createTime',
            width: 200,
            Header: 'Create Time',
            accessor: 'createTime',
            Cell: ({ row }: any) => formatDate(new Date(row.original.createTime)),
        },
        {
            id: 'lastUpdateTime',
            width: 200,
            Header: 'Last Update Time',
            accessor: 'lastUpdateTime',
            Cell: ({ row }: any) => formatDate(new Date(row.original.lastUpdateTime)),
        },
    ];

    return fields;
};

const ApplicationTable: FunctionComponent<ApplicationTableProps> = ({
    applications = [],
    disableRowSelect = true,
    disableToolbar = false,
    disableCreate = false,
    disableDelete = false,
    tableName,
    OnDeleteApplication = () => {},
}) => {
    const history = useHistory();

    const [selectedApplications, setSelectedApplications] = useState<
        ApplicationSummary[]
    >([]);

    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions();
    }, []);

    const tableActions = useMemo(() => {
        const pathUpdate = selectedApplications[0]?.name
            ? generatePath(ROUTE_APPLICATION_UPDATE, {
                  applicationId: selectedApplications[0].name,
              })
            : '';
        return (
            <Inline>
                {!disableRowSelect && (
                    <HasGroups groups={PERMISSION_APPLICATION_MANAGE}>
                        <Button
                            disabled={selectedApplications.length !== 1}
                            onClick={() => {
                                history.push(pathUpdate);
                            }}
                        >
                            Update
                        </Button>
                    </HasGroups>
                )}
                {!disableRowSelect && !disableDelete && (
                    <HasGroups groups={PERMISSION_APPLICATION_MANAGE}>
                        <Button
                            disabled={selectedApplications.length !== 1}
                            onClick={() => {
                                OnDeleteApplication(selectedApplications);
                            }}
                        >
                            Delete
                        </Button>
                    </HasGroups>
                )}
                {!disableCreate && (
                    <HasGroups groups={PERMISSION_APPLICATION_MANAGE}>
                        <Button
                            variant="primary"
                            onClick={() => {
                                history.push(ROUTE_APPLICATION_CREATE);
                            }}
                        >
                            Add new Application
                        </Button>
                    </HasGroups>
                )}
            </Inline>
        );
    }, [
        selectedApplications,
        history,
        disableRowSelect,
        OnDeleteApplication,
        disableCreate,
        disableDelete,
    ]);

    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={tableName || `Applications (${applications.length})`}
            disableRowSelect={disableRowSelect}
            multiSelect={false}
            actionGroup={tableActions}
            onSelectionChange={(selectedItems) => {
                if (!isEqual(selectedApplications, selectedItems)) {
                    setSelectedApplications(selectedItems);
                }
            }}
            getRowId={(data) => data.name}
            items={applications}
            disableSettings={disableToolbar}
            disableFilters={disableToolbar}
            disablePagination={disableToolbar}
            sortBy={[{ id: 'lastUpdateTime', desc: true }]}
        />
    );
};

export default ApplicationTable;
