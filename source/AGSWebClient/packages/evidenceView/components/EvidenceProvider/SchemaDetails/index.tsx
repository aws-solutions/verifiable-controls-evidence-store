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
import { formatDate } from '@ags/webclient-core/utils/helpers';
import ReactJson from 'react-json-view';
import Container from 'aws-northstar/layouts/Container';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import Stack from 'aws-northstar/layouts/Stack';
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout';

import { SchemaDetails } from '@ags/webclient-evidence-core/types';

export interface EvidenceProviderSchemaDetailsProps {
    schemaDetails?: SchemaDetails;
}

const EvidenceProviderSchemaDetails: FunctionComponent<EvidenceProviderSchemaDetailsProps> =
    ({ schemaDetails }) => {
        return (
            <Stack>
                <Container
                    title={`Schema Details for Evidence Provider - ${schemaDetails?.providerId}`}
                    subtitle={`Details about the ${schemaDetails?.schemaId} Schema`}
                >
                    <ColumnLayout>
                        <Column key="column1">
                            <Stack>
                                <KeyValuePair
                                    label="Schema ID"
                                    value={schemaDetails?.schemaId}
                                ></KeyValuePair>
                            </Stack>
                        </Column>

                        <Column key="column1">
                            <Stack>
                                <KeyValuePair
                                    label="Authority Id"
                                    value={schemaDetails?.providerId}
                                ></KeyValuePair>
                            </Stack>
                        </Column>

                        <Column key="column1">
                            <Stack>
                                <KeyValuePair
                                    label="Created Timestamp"
                                    value={
                                        schemaDetails?.createdTimestamp &&
                                        formatDate(
                                            new Date(schemaDetails?.createdTimestamp)
                                        )
                                    }
                                ></KeyValuePair>
                            </Stack>
                        </Column>
                    </ColumnLayout>
                </Container>
                <Container title={'Evidence Provider Schema content'}>
                    <ReactJson
                        src={schemaDetails?.content as Object}
                        displayDataTypes={false}
                        style={{ fontSize: '12px' }}
                    />
                </Container>
            </Stack>
        );
    };

export default EvidenceProviderSchemaDetails;
