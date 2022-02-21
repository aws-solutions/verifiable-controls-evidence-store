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
import { ReactElement } from 'react';
import HelpPanel, { HelpPanelProps } from 'aws-northstar/components/HelpPanel';
import Text from 'aws-northstar/components/Text';
import Heading from 'aws-northstar/components/Heading';
import Stack from 'aws-northstar/layouts/Stack';
import Link from 'aws-northstar/components/Link';

const GovernanceHubHelpPanel = (): ReactElement<HelpPanelProps> => {
    return (
        <HelpPanel
            header="AWS Governance Suite"
            learnMoreFooter={[
                <Link href="/" target="_blank">
                    Get started guide
                </Link>,
            ]}
        >
            <Stack>
                <Stack>
                    <Heading variant="h3">
                        <strong>Fully managed solution to meet compliance needs</strong>
                    </Heading>
                    <Text variant="p">
                        Don’t have to bespoke application architecture from scratch to
                        fulfill regulatory obligations and industry controls.
                    </Text>
                    <Text variant="p">
                        Governance Suite provides well architected templates with best
                        practices for risk and compliance management.
                    </Text>
                </Stack>
                <Stack>
                    <Heading variant="h3">
                        <strong>Audit operational risk and compliance</strong>
                    </Heading>
                    <Text variant="p">
                        Governance Suite provisions infra with pre-configured audit tools
                        to manage operational risks. Governance Suite alterts when
                        regulatory violation occurs.
                    </Text>
                </Stack>
            </Stack>
        </HelpPanel>
    );
};

export default GovernanceHubHelpPanel;
