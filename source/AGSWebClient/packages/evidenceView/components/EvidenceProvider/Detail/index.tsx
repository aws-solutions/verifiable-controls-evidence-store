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
import Container from 'aws-northstar/layouts/Container';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import Stack from 'aws-northstar/layouts/Stack';
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';
export interface EvidenceProviderProps {
    evidenceProvider?: EvidenceProvider;
}

const EvidenceProviderDetail: FunctionComponent<EvidenceProviderProps> = ({
    evidenceProvider,
}) => {
    return (
        <Container
            title={`Evidence Provider Details - ${evidenceProvider?.name}`}
            subtitle={`Details about the ${evidenceProvider?.name} evidence provider.`}
            // actionGroup={renderActionGroup()}
        >
            <ColumnLayout>
                <Column key="column1">
                    <Stack>
                        <KeyValuePair
                            label="Name"
                            value={evidenceProvider?.name}
                        ></KeyValuePair>
                        <KeyValuePair
                            label="Description"
                            value={evidenceProvider?.description}
                        ></KeyValuePair>
                    </Stack>
                </Column>
                <Column key="column2">
                    <Stack>
                        <KeyValuePair
                            label="Status"
                            value={evidenceProvider?.enabled ? 'Active' : 'Not-Active'}
                        ></KeyValuePair>
                        <KeyValuePair
                            label="Created At"
                            value={
                                evidenceProvider?.createdTimestamp &&
                                formatDate(new Date(evidenceProvider?.createdTimestamp))
                            }
                        ></KeyValuePair>
                    </Stack>
                </Column>
                <Column key="column3">
                    <Stack>
                        <KeyValuePair
                            label="Schemas Available"
                            value={`${evidenceProvider?.schemas?.length || '-'}`}
                        ></KeyValuePair>
                    </Stack>
                </Column>
            </ColumnLayout>
        </Container>
    );
};

export default EvidenceProviderDetail;
