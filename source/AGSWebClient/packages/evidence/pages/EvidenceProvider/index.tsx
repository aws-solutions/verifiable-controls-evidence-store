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
import EvidenceProviderTable from '@ags/webclient-evidence-view/components/EvidenceProvider/Table';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';
import { QueryType } from '@ags/webclient-evidence-core/queries/types';
import { ROUTE_EVIDENCE_PROVIDER_CREATE } from '@ags/webclient-evidence-core/config/routes';

const EvidenceProviders: FunctionComponent = () => {
    const { isLoading, data, isError, error } = useAgsListQuery<EvidenceProvider>(
        QueryType.LIST_EVIDENCE_PROVIDERS
    );
    const history = useHistory();

    return (
        <QueryContainerTemplate
            loading={isLoading}
            error={isError && error ? error : undefined}
            data={data}
        >
            {(providers) => {
                return (
                    <EvidenceProviderTable
                        evidenceProviders={providers}
                        onCreate={() => {
                            history.push(ROUTE_EVIDENCE_PROVIDER_CREATE);
                        }}
                    />
                );
            }}
        </QueryContainerTemplate>
    );
};

export default EvidenceProviders;
