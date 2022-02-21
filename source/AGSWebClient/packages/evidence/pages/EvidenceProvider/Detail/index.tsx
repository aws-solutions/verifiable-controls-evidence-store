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
import { useParams } from 'react-router-dom';
import Stack from 'aws-northstar/layouts/Stack';

import HeadingStripe from 'aws-northstar/components/HeadingStripe';

import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import { useAgsQuery } from '@ags/webclient-core/queries';

import EvidenceProviderDetail from '@ags/webclient-evidence-view/components/EvidenceProvider/Detail';
import EvidenceProviderSchemaTable from '@ags/webclient-evidence-view/components/EvidenceProvider/Schema';
import { QueryType } from '@ags/webclient-evidence-core/queries/types';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';

const EvidenceProviderView: FunctionComponent = () => {
    const { providerId } = useParams<{ providerId: string }>();
    const {
        isLoading: isLoadingEvidenceProvider,
        isError: isErrorEvidenceProvider,
        error: errorEvidenceProvider,
        data: evidenceProvider,
    } = useAgsQuery<EvidenceProvider>(QueryType.GET_EVIDENCE_PROVIDER, providerId);

    const isError = isErrorEvidenceProvider && errorEvidenceProvider;
    return (
        <QueryContainerTemplate
            loading={isLoadingEvidenceProvider}
            error={isError && errorEvidenceProvider ? errorEvidenceProvider : undefined}
            data={evidenceProvider}
        >
            {(data) => (
                <Stack>
                    <HeadingStripe title={data?.name} />
                    <EvidenceProviderDetail evidenceProvider={evidenceProvider} />
                    <EvidenceProviderSchemaTable evidenceProvider={evidenceProvider} />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default EvidenceProviderView;
