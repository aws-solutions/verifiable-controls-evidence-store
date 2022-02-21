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
import { ControlObjective } from '@ags/webclient-risks-core/types';

export interface ControlObjectiveDetailProps {
    controlObjective?: ControlObjective;
}

export function controlObjFullfillmentStatus(controlObjective: ControlObjective) {
    return controlObjective.controlTechniqueIds &&
        controlObjective.controlTechniqueIds.length > 0 ? (
        <StatusIndicator statusType="positive">Fullfiled</StatusIndicator>
    ) : (
        <StatusIndicator statusType="negative">Not Fullfiled</StatusIndicator>
    );
}

const ControlObjectiveDetail: FunctionComponent<ControlObjectiveDetailProps> = ({
    controlObjective,
}) => {
    return (
        <Container title="General Information">
            <ColumnLayout renderDivider={true}>
                <Column>
                    <Stack>
                        <KeyValuePair label="Name" value={controlObjective?.name} />
                        <KeyValuePair
                            label="Description"
                            value={controlObjective?.description}
                        />
                    </Stack>
                </Column>
                <Column>
                    <Stack>
                        <KeyValuePair
                            label="Created At"
                            value={
                                controlObjective?.createTime &&
                                formatDate(new Date(controlObjective.createTime))
                            }
                        />
                        <KeyValuePair
                            label="Last Updated At"
                            value={
                                controlObjective?.lastUpdateTime &&
                                formatDate(new Date(controlObjective.lastUpdateTime))
                            }
                        />
                        {controlObjFullfillmentStatus(controlObjective!)}
                    </Stack>
                </Column>
            </ColumnLayout>
        </Container>
    );
};

export default ControlObjectiveDetail;
