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
import { Estate } from '@ags/webclient-estates-core/types';
import { QueryType } from '@ags/webclient-estates-core/queries';
import { useAgsQuery } from '@ags/webclient-core/queries';

export interface EnvironmentAssociationDetailsProps {
    entityId: string;
}

const EnvironmentAssociationDetails: FunctionComponent<EnvironmentAssociationDetailsProps> =
    ({ entityId }) => {
        const {
            isLoading,
            data: estates,
            isError,
            error,
        } = useAgsQuery<{ results: Estate[] }>(QueryType.GET_ESTATE_BY_ENV, entityId);

        console.log(estates);
        return (
            <Container title="Environment">
                <QueryContainerTemplate
                    loading={isLoading}
                    error={isError && error ? error : undefined}
                    data={estates?.results[0]}
                >
                    {(estate) => (
                        <Stack>
                            <KeyValuePair
                                label="Name"
                                value={
                                    estate?.environments?.find(
                                        ({ id }) => id === entityId
                                    )?.name
                                }
                            ></KeyValuePair>
                            <KeyValuePair
                                label="Estate Name"
                                value={estate?.name}
                            ></KeyValuePair>
                        </Stack>
                    )}
                </QueryContainerTemplate>
            </Container>
        );
    };
export default EnvironmentAssociationDetails;
