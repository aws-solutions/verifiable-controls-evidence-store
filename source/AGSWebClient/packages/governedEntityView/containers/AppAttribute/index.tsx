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
import { ApplicationAttribute } from '@ags/webclient-applications-core/types';
import { useAgsQuery } from '@ags/webclient-core/queries';
import { QueryType } from '@ags/webclient-applications-core/queries';

export interface AppAttributeAssociationDetailsProps {
    entityId: string;
}

const AppAttributeAssociationDetails: FunctionComponent<AppAttributeAssociationDetailsProps> =
    ({ entityId }) => {
        const {
            isLoading,
            data: appAttribute,
            isError,
            error,
        } = useAgsQuery<ApplicationAttribute>(QueryType.GET_APPATTRIBUTE, entityId);

        return (
            <Container title="Application Attribute">
                <QueryContainerTemplate
                    loading={isLoading}
                    error={isError && error ? error : undefined}
                    data={appAttribute}
                >
                    {(attribute) => (
                        <ColumnLayout renderDivider={true}>
                            <Column>
                                <Stack>
                                    <KeyValuePair
                                        label="Name"
                                        value={attribute.name}
                                    ></KeyValuePair>
                                    <KeyValuePair
                                        label="Description"
                                        value={attribute.description}
                                    ></KeyValuePair>
                                </Stack>
                            </Column>
                            <Column>
                                <Stack>
                                    <KeyValuePair
                                        label="Key"
                                        value={attribute.key}
                                    ></KeyValuePair>
                                    <KeyValuePair
                                        label="Value"
                                        value={attribute.value}
                                    ></KeyValuePair>
                                </Stack>
                            </Column>
                        </ColumnLayout>
                    )}
                </QueryContainerTemplate>
            </Container>
        );
    };
export default AppAttributeAssociationDetails;
