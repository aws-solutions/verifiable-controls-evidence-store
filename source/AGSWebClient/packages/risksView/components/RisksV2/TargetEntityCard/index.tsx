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
import Stack from 'aws-northstar/layouts/Stack';
import Box from 'aws-northstar/layouts/Box';
import Paper from 'aws-northstar/layouts/Paper';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import Text from 'aws-northstar/components/Text';
import { RiskTargetEntity } from '@ags/webclient-risks-core/types';
import Inline from 'aws-northstar/layouts/Inline';

export interface TargetEntityCardProps extends RiskTargetEntity {
    entity?: {
        name: string;
    };
}

const TargetEntityCard: FunctionComponent<TargetEntityCardProps> = ({
    id,
    type,
    entity,
    owner,
    likelihood,
    impacts,
}) => {
    const impactsNode = useMemo(() => {
        return (
            <Inline>
                {impacts.map((ip) => (
                    <Paper>
                        <Box p={1}>
                            <Stack spacing="xs">
                                <Text>
                                    <b>{ip.name}</b>
                                </Text>
                                <Text>severity: {ip.severity}</Text>
                                <Text>likelihood: {ip.likelihood}</Text>
                            </Stack>
                        </Box>
                    </Paper>
                ))}
            </Inline>
        );
    }, [impacts]);

    return (
        <Box width="100%">
            <Paper>
                <Box p={1}>
                    <Stack spacing="xs">
                        <Text>
                            <b>
                                {type} - {id} - {entity?.name}
                            </b>
                        </Text>
                        <KeyValuePair label="Owner" value={owner} />
                        <KeyValuePair label="Likelihood" value={likelihood} />
                        <KeyValuePair label="Impacts" value={impactsNode} />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
};

export default TargetEntityCard;
