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
import Stack from 'aws-northstar/layouts/Stack';
import Container from 'aws-northstar/layouts/Container';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import { BusinessUnit } from '@ags/webclient-business-units-core/types';
import { QueryType } from '@ags/webclient-business-units-core/queries';
import { useAgsQuery } from '@ags/webclient-core/queries';

export interface BusinessUnitAssociationDetailsProps {
    entityId: string;
}

const BusinessUnitAssociationDetails: FunctionComponent<BusinessUnitAssociationDetailsProps> =
    ({ entityId }) => {
        const {
            isLoading,
            data: businessUnit,
            isError,
            error,
        } = useAgsQuery<BusinessUnit>(QueryType.GET_BUSUSINESSUNIT, entityId);

        return (
            <Container title="Business Unit">
                <QueryContainerTemplate
                    loading={isLoading}
                    error={isError && error ? error : undefined}
                    data={businessUnit}
                >
                    {(businessUnit) => (
                        <Stack>
                            <KeyValuePair
                                label="Name"
                                value={businessUnit?.name}
                            ></KeyValuePair>
                            <KeyValuePair
                                label="Description"
                                value={businessUnit?.description}
                            ></KeyValuePair>
                        </Stack>
                    )}
                </QueryContainerTemplate>
            </Container>
        );
    };
export default BusinessUnitAssociationDetails;
