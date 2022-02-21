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
import { Application } from '@ags/webclient-applications-core/types';
import { useAgsListQuery } from '@ags/webclient-core/queries';
import GovenedEntityListView from '../../components/Association/ListView';
import { QueryType } from '@ags/webclient-applications-core/queries';

export interface AppliactionListViewProps {
    onEditAssociation: (selectedGovernedEntityId: string) => void;
}

const extraColumns = [
    {
        id: 'applicationOwner',
        width: 300,
        Header: 'Application Owner',
        accessor: 'applicationOwner',
    },
    {
        id: 'description',
        width: 500,
        Header: 'Description',
        accessor: 'description',
    },
];

const ApplicationListView: FunctionComponent<AppliactionListViewProps> = ({
    onEditAssociation,
}) => {
    // load applications
    const { isLoading, data, isError, error } = useAgsListQuery<Application>(
        QueryType.LIST_APPLICATIONS
    );

    const transformData = (data: Application[]) =>
        data.map((application) => ({
            id: application.name.toUpperCase(),
            name: application.name,
            description: application.description,
            applicationOwner: application.applicationOwner,
        }));

    return (
        <GovenedEntityListView
            onEditAssociation={onEditAssociation}
            entityName="Application"
            isLoading={isLoading}
            extraColumns={extraColumns}
            data={transformData(data ?? [])}
            isError={isError}
            error={error}
        />
    );
};

export default ApplicationListView;
