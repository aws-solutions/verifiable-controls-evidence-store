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
import Table, { Column, FetchDataOptions } from 'aws-northstar/components/Table';
import Link from 'aws-northstar/components/Link';
import StatusIndicator from 'aws-northstar/components/StatusIndicator';
import Button from 'aws-northstar/components/Button';
import Inline from 'aws-northstar/layouts/Inline';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import { EstateDisplay, Environment } from '@ags/webclient-estates-core/types';
import { PERMISSION_ESTATE_MANAGE } from '@ags/webclient-estates-core/config/permissions';

export interface EstatesTableProps {
    estates?: EstateDisplay[];
    defaultPageSize?: number;
    rowCount?: number;
    onCreate?: () => void;
    onEnvClassesMgr?: () => void;
    getData?: (options: FetchDataOptions) => Promise<void>;
}

const columnDefinitions: Column<EstateDisplay>[] = [
    {
        id: 'name',
        width: 220,
        Header: 'Name',
        accessor: 'name',
        Cell: ({ row }: any) => {
            if (row && row.original) {
                return (
                    <Link href={`/estates/${row.original.id}`}>{row.original.name}</Link>
                );
            }
            return <StatusIndicator statusType="negative">Unknown name</StatusIndicator>;
        },
    },
    { id: 'parentBUId', width: 150, Header: 'Business Unit', accessor: 'parentBUName' },
    {
        id: 'toolingAccountId',
        width: 150,
        Header: 'Tooling Account',
        accessor: 'toolingAccountId',
    },
    {
        id: 'environments',
        width: 250,
        Header: 'Environments',
        accessor: 'environments',
        Cell: ({ row }: any) => {
            if (row.original.environments) {
                return (
                    <Inline spacing="xs">
                        {Array.prototype.map.call(
                            row.original.environments,
                            (environment: Environment, index: number) =>
                                environment.name +
                                (index < row.original.environments.length - 1 ? ', ' : '')
                        )}
                    </Inline>
                );
            }
            return null;
        },
    },
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
    },
];

const EstatesTable: FunctionComponent<EstatesTableProps> = ({
    estates = [],
    defaultPageSize,
    rowCount,
    onCreate,
    onEnvClassesMgr,
    getData,
}) => {
    /** Action group for the table */
    const actionGroup = useMemo(
        () => (
            <HasGroups groups={PERMISSION_ESTATE_MANAGE}>
                <Inline>
                    <Button variant={'primary'} onClick={onEnvClassesMgr}>
                        Manage Environment Classes
                    </Button>

                    <Button disabled={true}>Update</Button>

                    <Button disabled={true}>Delete</Button>

                    <Button variant={'primary'} onClick={onCreate}>
                        Request a new Estate
                    </Button>
                </Inline>
            </HasGroups>
        ),
        [onCreate, onEnvClassesMgr]
    );

    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={`Estates (${estates.length})`}
            actionGroup={actionGroup}
            items={estates}
            multiSelect={false}
            sortBy={[{ id: 'lastUpdatedTime', desc: true }]}
            rowCount={rowCount}
            onFetchData={getData}
            defaultPageSize={defaultPageSize}
        />
    );
};

export default EstatesTable;
