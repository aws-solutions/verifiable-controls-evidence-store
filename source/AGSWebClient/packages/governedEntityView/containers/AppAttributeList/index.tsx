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
import { ApplicationAttribute } from '@ags/webclient-applications-core/types';
import { useAgsListQuery } from '@ags/webclient-core/queries';
import { QueryType } from '@ags/webclient-applications-core/queries';

import GovenedEntityListView from '../../components/Association/ListView';

export interface AppAttributeListViewProps {
    onEditAssociation: (selectedGovernedEntityId: string) => void;
}

const extraColumns = [
    {
        id: 'key',
        width: 200,
        Header: 'Key',
        accessor: 'key',
    },
    {
        id: 'value',
        width: 200,
        Header: 'Value',
        accessor: 'value',
    },
    {
        id: 'description',
        width: 500,
        Header: 'Description',
        accessor: 'description',
    },
];

const AppAttributeListView: FunctionComponent<AppAttributeListViewProps> = ({
    onEditAssociation,
}) => {
    // load application attribute
    const { isLoading, data, isError, error } = useAgsListQuery<ApplicationAttribute>(
        QueryType.LIST_APPATTRIBUTES
    );

    const transformData = (data: ApplicationAttribute[]) =>
        data.map((attribute) => {
            return {
                id: attribute.name.toUpperCase(),
                name: attribute.name,
                description: attribute.description,
                key: attribute.key,
                value: attribute.value,
            };
        });

    return (
        <GovenedEntityListView
            onEditAssociation={onEditAssociation}
            entityName="Application Attributes"
            extraColumns={extraColumns}
            isLoading={isLoading}
            data={transformData(data ?? [])}
            isError={isError}
            error={error}
        />
    );
};

export default AppAttributeListView;
