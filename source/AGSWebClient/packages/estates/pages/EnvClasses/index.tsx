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
import { useHistory } from 'react-router-dom';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import { useAgsListQuery } from '@ags/webclient-core/queries';
import EnvClassesTable from '@ags/webclient-estates-view/components/EnvClass/Table';
import { EnvironmentClass } from '@ags/webclient-estates-core/types';
import { QueryType } from '@ags/webclient-estates-core/queries/types';
import { ROUTE_ENVCLASS_CREATE } from '@ags/webclient-estates-core/config/routes';

const EnvClassesView: FunctionComponent = () => {
    const history = useHistory();

    // load environment classes
    const {
        data: envClasses,
        isLoading: isLoadingEnvClasses,
        isError: isErrorEnvClasses,
        error,
    } = useAgsListQuery<EnvironmentClass>(QueryType.LIST_ENVCLASSES);

    return (
        <QueryContainerTemplate
            loading={isLoadingEnvClasses}
            error={isErrorEnvClasses && error ? error : undefined}
            data={envClasses}
        >
            {(data) => {
                return (
                    <EnvClassesTable
                        envClasses={data}
                        onCreate={() => {
                            history.push(ROUTE_ENVCLASS_CREATE, {
                                from: history.location.pathname,
                            });
                        }}
                    />
                );
            }}
        </QueryContainerTemplate>
    );
};

export default EnvClassesView;
