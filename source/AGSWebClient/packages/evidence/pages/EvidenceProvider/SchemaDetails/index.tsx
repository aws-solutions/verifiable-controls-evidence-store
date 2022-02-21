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

import { SchemaDetails } from '@ags/webclient-evidence-core/types';
import { QueryType } from '@ags/webclient-evidence-core/queries/types';

import EvidenceProviderSchemaDetails from '@ags/webclient-evidence-view/components/EvidenceProvider/SchemaDetails';

const EvidenceProviderSchemaView: FunctionComponent = () => {
    const { providerId } = useParams<{ providerId: string }>();
    const { schemaId } = useParams<{ schemaId: string }>();
    const {
        isLoading: isLoadingSchemaDetails,
        isError: isErrorSchemaDetails,
        error: errorSchemaDetails,
        data: schemaDetails,
    } = useAgsQuery<SchemaDetails>(QueryType.GET_SCHEMA_DETAILS, providerId, schemaId);

    const isError = isErrorSchemaDetails;
    return (
        <QueryContainerTemplate
            loading={isLoadingSchemaDetails}
            error={isError && errorSchemaDetails ? errorSchemaDetails : undefined}
            data={schemaDetails}
        >
            {(data) => (
                <Stack>
                    <HeadingStripe title={data?.schemaId} />
                    <EvidenceProviderSchemaDetails schemaDetails={schemaDetails} />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default EvidenceProviderSchemaView;
