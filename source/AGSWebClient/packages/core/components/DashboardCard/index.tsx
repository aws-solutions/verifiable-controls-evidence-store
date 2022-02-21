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
import Box from 'aws-northstar/layouts/Box';
import Text from 'aws-northstar/components/Text';
import Button from 'aws-northstar/components/Button';

export interface DashboardCardProps {
    title: string;
    subtitle?: string;
    onResetClick?: () => void;
}

const DashboardCard: FunctionComponent<DashboardCardProps> = ({
    title,
    subtitle,
    onResetClick,
    children,
}) => {
    return (
        <Box
            display="flex"
            width="100%"
            justifyContent="center"
            marginTop={1}
            textAlign="center"
            alignItems="center"
        >
            <Box justifyContent="center">
                <Box lineHeight={2}>
                    <Text>
                        {title}
                        {onResetClick && (
                            <Button variant="link" onClick={onResetClick}>
                                Reset
                            </Button>
                        )}
                    </Text>
                </Box>
                {subtitle && (
                    <Box>
                        <Text variant="small">{subtitle}</Text>
                    </Box>
                )}
                <Box display="flex" justifyContent="center">
                    <Text variant="small">{children}</Text>
                </Box>
            </Box>
        </Box>
    );
};

export default DashboardCard;
