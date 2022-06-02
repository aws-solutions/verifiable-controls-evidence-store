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
import Table from 'aws-northstar/components/Table';
export interface KeyValueTableProps {
    data?: Record<string, string>;
    disableRowSelect?: boolean;
    disableToolbar?: boolean;
    disableCreate?: boolean;
    disableDelete?: boolean;
    tableName?: string;
}

export const getColumnDefinitions = () => {
    const fields: any[] = [
        {
            id: 'key',
            width: '300',
            Header: 'Key',
            accessor: 'key',
        },
        {
            id: 'value',
            width: '600',
            Header: 'Value',
            accessor: 'value',
        },
    ];

    return fields;
};

const KeyValueTable: FunctionComponent<KeyValueTableProps> = ({
    data = {},
    disableRowSelect = true,
    disableToolbar = true,
    tableName,
}) => {
    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions();
    }, []);
    const keys = Object.keys(data);
    const items = keys.map((k) => {
        return { key: k, value: data[k] };
    });
    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={`${tableName} (${keys.length})`}
            disableRowSelect={disableRowSelect}
            multiSelect={false}
            getRowId={(data) => data.key}
            items={items}
            disableSettings={disableToolbar}
            disableFilters={disableToolbar}
            disablePagination={disableToolbar}
            sortBy={[{ id: 'key' }]}
        />
    );
};

export default KeyValueTable;
