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
import Box from 'aws-northstar/layouts/Box';
import Paper from 'aws-northstar/layouts/Paper';
import Text from 'aws-northstar/components/Text';

export interface ControlTechniqueCardProps {
    name?: string;
    description?: string;
    controlType?: string;
}

const ControlTechniqueCard: FunctionComponent<ControlTechniqueCardProps> = ({
    name,
    description,
    controlType,
}) => {
    return (
        <Box width="100%">
            <Paper>
                <Box p={1}>
                    <Stack spacing="xs">
                        <Text>
                            <b>{name}</b>
                        </Text>
                        <Text variant="p">{description}</Text>
                        <Text variant="small">Type: {controlType}</Text>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
};

export default ControlTechniqueCard;
