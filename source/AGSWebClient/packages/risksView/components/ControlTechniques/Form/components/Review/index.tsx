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
import { FunctionComponent, useMemo } from 'react';
import { ControlTechnique } from '@ags/webclient-risks-core/types';
import Stack from 'aws-northstar/layouts/Stack';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import ExpandableSection from 'aws-northstar/components/ExpandableSection';
import ControlTechniqueStatus from '../../../../ControlTechniques/Status';

const ControlTechniqueReview: FunctionComponent<{ data: ControlTechnique }> = ({
    data,
}) => {
    const integrationDetails = useMemo(() => {
        const { techniqueDetails } = data;
        switch (techniqueDetails.integrationType) {
            case 'REST':
                return (
                    <Stack>
                        <KeyValuePair
                            label="REST Endpoint"
                            value={data.techniqueDetails.restEndpoint}
                        />
                    </Stack>
                );
            case 'EVENT':
                return (
                    <Stack>
                        <KeyValuePair
                            label="Event Bus"
                            value={data.techniqueDetails.eventBus}
                        />
                        <KeyValuePair
                            label="Detail Type"
                            value={data.techniqueDetails.detailType}
                        />
                    </Stack>
                );
            case 'AWS_IAM':
            case 'AWS_SCP':
                return (
                    <Stack>
                        <KeyValuePair
                            label="AWS Config Rule Arn"
                            value={data.techniqueDetails.awsPolicyArn}
                        />
                    </Stack>
                );
            case 'AWS_CONFIG':
                return (
                    <Stack>
                        <KeyValuePair
                            label="Config Rule ARN"
                            value={data.techniqueDetails.configRuleArn}
                        />
                        <KeyValuePair
                            label="Conformance Pack File URLs"
                            value={data.techniqueDetails.cpSourceUrls}
                        />
                    </Stack>
                );
            default:
                return undefined;
        }
    }, [data]);
    return (
        <Stack>
            <ExpandableSection header="General Information" expanded={true}>
                <Stack>
                    <KeyValuePair label="Name" value={data.name} />
                    <KeyValuePair label="Description" value={data.description} />
                    <KeyValuePair label="Type" value={data.controlType} />
                    <KeyValuePair
                        label="Status"
                        value={<ControlTechniqueStatus enabled={data.enabled} />}
                    />
                </Stack>
            </ExpandableSection>
            <ExpandableSection header="Policy Settings" expanded={true}>
                <Stack>
                    <KeyValuePair
                        label="Policy Id"
                        value={data.techniqueDetails.policyId}
                    />
                    <KeyValuePair
                        label="Bundle Name"
                        value={data.techniqueDetails.bundleName}
                    />
                    <KeyValuePair
                        label="Namespace"
                        value={data.techniqueDetails.namespace}
                    />
                </Stack>
            </ExpandableSection>
            <ExpandableSection
                header={`Integration (${data.techniqueDetails.integrationType})`}
                expanded={true}
            >
                {integrationDetails}
            </ExpandableSection>
        </Stack>
    );
};

export default ControlTechniqueReview;
