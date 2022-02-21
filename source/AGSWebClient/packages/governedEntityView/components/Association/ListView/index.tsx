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
import { FunctionComponent, useState, useMemo, useCallback } from 'react';
import isEqual from 'lodash.isequal';
import Table, { Column } from 'aws-northstar/components/Table';
import Button from 'aws-northstar/components/Button';
import PageError from '@ags/webclient-core/components/PageError';

export interface GovernedEntityListViewProps<T> {
    onEditAssociation: (selectedGovernedEntityId: string) => void;
    entityName: string;
    extraColumns?: Column<any>[];
    useName?: boolean;
    isLoading: boolean;
    data: T | undefined;
    isError: boolean;
    error: Error | null;
}

const GovenedEntityListView: FunctionComponent<GovernedEntityListViewProps<any>> = ({
    onEditAssociation,
    entityName,
    extraColumns,
    useName = false,
    isLoading,
    data,
    isError,
    error,
}) => {
    // selected
    const [selected, setSelected] = useState<typeof data[]>([]);

    const columnDefinitions: Column<typeof data>[] = useMemo(() => {
        const columns: Column<typeof data>[] = [
            {
                id: 'name',
                width: 500,
                Header: 'Name',
                accessor: 'name',
            },
        ];

        if (extraColumns) {
            columns.push(...extraColumns);
        }

        return columns;
    }, [extraColumns]);

    const actions = useMemo(
        () => (
            <Button
                variant="primary"
                disabled={selected.length !== 1}
                onClick={() => {
                    onEditAssociation(useName ? selected[0].name : selected[0].id);
                }}
            >
                Edit Association
            </Button>
        ),
        [selected, onEditAssociation, useName]
    );

    const getRowId = useCallback((data) => (useName ? data.name : data.id), [useName]);

    if (isError) {
        return <PageError message={error ? error.message : undefined} />;
    }

    return (
        <Table
            tableTitle={`Select a ${entityName} to Manage`}
            columnDefinitions={columnDefinitions}
            items={data}
            multiSelect={false}
            loading={isLoading}
            actionGroup={actions}
            getRowId={getRowId}
            onSelectionChange={(selectedItems) => {
                if (!isEqual(selected, selectedItems)) {
                    setSelected(selectedItems);
                }
            }}
        />
    );
};

export default GovenedEntityListView;
