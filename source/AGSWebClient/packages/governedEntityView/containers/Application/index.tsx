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
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout';
import { Application } from '@ags/webclient-applications-core/types';
import { useAgsQuery } from '@ags/webclient-core/queries';
import { QueryType } from '@ags/webclient-applications-core/queries';

export interface ApplicationAssociationDetailsProps {
    entityId: string;
}

const ApplicationAssociationDetails: FunctionComponent<ApplicationAssociationDetailsProps> =
    ({ entityId }) => {
        const {
            isLoading,
            data: application,
            isError,
            error,
        } = useAgsQuery<Application>(QueryType.GET_APPLICATION, entityId);

        return (
            <Container title="Application">
                <QueryContainerTemplate
                    loading={isLoading}
                    error={isError && error ? error : undefined}
                    data={application}
                >
                    {(application) => (
                        <ColumnLayout renderDivider={true}>
                            <Column>
                                <Stack>
                                    <KeyValuePair
                                        label="Name"
                                        value={application?.name}
                                    ></KeyValuePair>
                                    <KeyValuePair
                                        label="Description"
                                        value={application?.description}
                                    ></KeyValuePair>
                                </Stack>
                            </Column>
                            <Column>
                                <Stack>
                                    <KeyValuePair
                                        label="Application Owner"
                                        value={application?.applicationOwner}
                                    ></KeyValuePair>
                                </Stack>
                            </Column>
                        </ColumnLayout>
                    )}
                </QueryContainerTemplate>
            </Container>
        );
    };
export default ApplicationAssociationDetails;
