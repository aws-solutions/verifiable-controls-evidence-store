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
import Container from 'aws-northstar/layouts/Container';
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout';
import Stack from 'aws-northstar/layouts/Stack';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import { ControlTechnique } from '@ags/webclient-risks-core/types';
import ControlTechniqueStatus from '../Status';
import { formatDate } from '@ags/webclient-core/utils/helpers';

export interface ControlTechniqueDetailProps {
    controlTechnique?: ControlTechnique;
}

const ControlTechniqueDetail: FunctionComponent<ControlTechniqueDetailProps> = ({
    controlTechnique,
}) => {
    return (
        <Stack>
            <Container title="General Information">
                <ColumnLayout renderDivider={true}>
                    <Column>
                        <Stack>
                            <KeyValuePair label="Name" value={controlTechnique?.name} />
                            <KeyValuePair
                                label="Control Type"
                                value={controlTechnique?.controlType}
                            />
                            <KeyValuePair
                                label="Description"
                                value={controlTechnique?.description}
                            />
                            <ControlTechniqueStatus enabled={controlTechnique?.enabled} />
                        </Stack>
                    </Column>
                    <Column>
                        <Stack>
                            <KeyValuePair
                                label="Status"
                                value={controlTechnique?.status}
                            />
                            <KeyValuePair
                                label="Created At"
                                value={
                                    controlTechnique?.createTime &&
                                    formatDate(new Date(controlTechnique.createTime))
                                }
                            />
                            <KeyValuePair
                                label="Last Updated At"
                                value={
                                    controlTechnique?.lastUpdateTime &&
                                    formatDate(new Date(controlTechnique.lastUpdateTime))
                                }
                            />
                        </Stack>
                    </Column>
                </ColumnLayout>
            </Container>
            <Container title="Technique Details">
                <ColumnLayout renderDivider={true}>
                    <Column>
                        <Stack>
                            <KeyValuePair
                                label="Integration Type"
                                value={
                                    controlTechnique?.techniqueDetails?.integrationType
                                }
                            />
                            <KeyValuePair
                                label="Policy ID"
                                value={controlTechnique?.techniqueDetails?.policyId}
                            />
                            <KeyValuePair
                                label="Policy Bundle Name"
                                value={controlTechnique?.techniqueDetails?.bundleName}
                            />
                            <KeyValuePair
                                label="Policy Namespace"
                                value={controlTechnique?.techniqueDetails?.namespace}
                            />
                        </Stack>
                    </Column>
                    <Column>
                        <Stack>
                            <KeyValuePair
                                label="REST Endpoint"
                                value={controlTechnique?.techniqueDetails?.restEndpoint}
                            />
                            <KeyValuePair
                                label="Event Bus"
                                value={controlTechnique?.techniqueDetails?.eventBus}
                            />
                            <KeyValuePair
                                label="Event Detail Type"
                                value={controlTechnique?.techniqueDetails?.detailType}
                            />
                            <KeyValuePair
                                label="AWS Policy ARN"
                                value={controlTechnique?.techniqueDetails?.awsPolicyArn}
                            />
                        </Stack>
                    </Column>
                    <Column>
                        <Stack>
                            <KeyValuePair
                                label="Config Rule ARN"
                                value={controlTechnique?.techniqueDetails?.configRuleArn}
                            ></KeyValuePair>
                            <KeyValuePair
                                label="Conformance Pack file URL"
                                value={controlTechnique?.techniqueDetails?.cpSourceUrls}
                            ></KeyValuePair>
                        </Stack>
                    </Column>
                </ColumnLayout>
            </Container>
        </Stack>
    );
};

export default ControlTechniqueDetail;
