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
import Table, { Column } from 'aws-northstar/components/Table';
import Inline from 'aws-northstar/layouts/Inline';
import Button from 'aws-northstar/components/Button';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import { EnvironmentClass } from '@ags/webclient-estates-core/types';
import { PERMISSION_ENVCLASS_MANAGE } from '@ags/webclient-estates-core/config/permissions';

export interface EnvClassesTableProps {
    envClasses?: EnvironmentClass[];
    onCreate?: () => void;
}

const columnDefinitions: Column<EnvironmentClass>[] = [
    {
        id: 'name',
        width: 250,
        Header: 'Name',
        accessor: 'name',
    },
    {
        id: 'description',
        width: 400,
        Header: 'Description',
        accessor: 'description',
    },
    {
        id: 'creationTime',
        width: 150,
        Header: 'Created At',
        accessor: 'creationTime',
        Cell: ({ row }: any) => formatDate(new Date(row.original.creationTime)),
    },
];

const EnvClassesTable: FunctionComponent<EnvClassesTableProps> = ({
    envClasses = [],
    onCreate,
}) => {
    const actionGroup = useMemo(
        () => (
            <HasGroups groups={PERMISSION_ENVCLASS_MANAGE}>
                <Inline>
                    <Button disabled={true}>Update</Button>

                    <Button disabled={true}>Delete</Button>

                    <Button variant={'primary'} onClick={onCreate}>
                        Create a New EnvClass
                    </Button>
                </Inline>
            </HasGroups>
        ),
        [onCreate]
    );

    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={`Environment Classes (${envClasses.length})`}
            items={envClasses}
            actionGroup={actionGroup}
            multiSelect={false}
            sortBy={[{ id: 'creationTime', desc: true }]}
        />
    );
};

export default EnvClassesTable;
