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
import { generatePath, useHistory } from 'react-router-dom';
import Table from 'aws-northstar/components/Table';
import Link from 'aws-northstar/components/Link';
import Button from 'aws-northstar/components/Button';
import Inline from 'aws-northstar/layouts/Inline';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import { BusinessUnit } from '@ags/webclient-business-units-core/types';
import {
    ROUTE_BUSINESS_UNIT_DETAILS,
    ROUTE_BUSINESS_UNIT_CREATE_WITH_PARENT,
} from '@ags/webclient-business-units-core/config/routes';
import { PERMISSION_BUSINESS_UNIT_MANAGE } from '@ags/webclient-business-units-core/config/permissions';

export interface BusinessUnitTableProps {
    businessUnits?: BusinessUnit[];
    parentBusinessUnitId?: string;
    disableToolbar?: boolean;
    disableCreate?: boolean;
    tableName?: string;
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
                        href={generatePath(ROUTE_BUSINESS_UNIT_DETAILS, {
                            businessUnitId: row.original.id,
                        })}
                    >
                        {row.original.name}
                    </Link>
                );
            },
        },
        {
            id: 'businessOwner',
            width: 300,
            Header: 'Business Owner',
            accessor: 'businessOwner',
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

const BusinessUnitTable: FunctionComponent<BusinessUnitTableProps> = ({
    businessUnits = [],
    parentBusinessUnitId = '',
    disableToolbar = false,
    disableCreate = true,
    tableName,
}) => {
    const history = useHistory();

    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions();
    }, []);

    const tableActions = useMemo(() => {
        const createPath = parentBusinessUnitId
            ? generatePath(ROUTE_BUSINESS_UNIT_CREATE_WITH_PARENT, {
                  parentId: parentBusinessUnitId,
              })
            : '';
        return (
            <Inline>
                {!disableCreate && (
                    <HasGroups groups={PERMISSION_BUSINESS_UNIT_MANAGE}>
                        <Button
                            variant="primary"
                            onClick={() => {
                                history.push(createPath);
                            }}
                            disabled={!createPath}
                        >
                            Add new Business Unit
                        </Button>
                    </HasGroups>
                )}
            </Inline>
        );
    }, [history, disableCreate, parentBusinessUnitId]);

    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={tableName || `Business Units (${businessUnits.length})`}
            disableRowSelect={true}
            multiSelect={false}
            actionGroup={tableActions}
            getRowId={(data) => data.id}
            items={businessUnits}
            disableSettings={disableToolbar}
            disableFilters={disableToolbar}
            disablePagination={disableToolbar}
        />
    );
};

export default BusinessUnitTable;
