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
import StatusIndicator from 'aws-northstar/components/StatusIndicator';
import Container from 'aws-northstar/layouts/Container';
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout';
import Stack from 'aws-northstar/layouts/Stack';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import { Risk } from '@ags/webclient-risks-core/types';

export interface RiskDetailProps {
    risk?: Risk;
}

export function riskMitigatedStatus(Risk: Risk) {
    return Risk.controlObjectiveIds && Risk.controlObjectiveIds.length > 0 ? (
        <StatusIndicator statusType="positive">Mitigated</StatusIndicator>
    ) : (
        <StatusIndicator statusType="negative">Not Mitigated</StatusIndicator>
    );
}

const RiskDetail: FunctionComponent<RiskDetailProps> = ({ risk }) => {
    return (
        <Container title="General Information">
            <ColumnLayout renderDivider={true}>
                <Column>
                    <Stack>
                        <KeyValuePair label="Name" value={risk?.name} />
                        <KeyValuePair label="Description" value={risk?.description} />
                        <KeyValuePair label="Category" value={risk?.category} />
                        <KeyValuePair label="Severity" value={risk?.severity} />
                    </Stack>
                </Column>
                <Column>
                    <Stack>
                        <KeyValuePair label="Likelihood" value={risk?.likelihood} />
                        <KeyValuePair label="Rating" value={risk?.rating} />
                        <KeyValuePair
                            label="Created At"
                            value={
                                risk?.createTime && formatDate(new Date(risk.createTime))
                            }
                        />
                        <KeyValuePair
                            label="Last Updated At"
                            value={
                                risk?.lastUpdateTime &&
                                formatDate(new Date(risk.lastUpdateTime))
                            }
                        />
                        {riskMitigatedStatus(risk!)}
                    </Stack>
                </Column>
            </ColumnLayout>
        </Container>
    );
};

export default RiskDetail;
