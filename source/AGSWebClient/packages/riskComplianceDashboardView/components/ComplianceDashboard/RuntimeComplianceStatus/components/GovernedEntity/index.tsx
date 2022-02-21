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
import Box from 'aws-northstar/layouts/Box';
import Table, { Column } from 'aws-northstar/components/Table';
import { ComplianceStatusSummary } from '@ags/webclient-compliance-core/types';
import { GovernedEntityComplianceStatusProps } from '../../../types';
import getComplianceStatusColumnDefinition from '../../utils/getComplianceStatusColumnDefinitions';

const GovernedEntityComplianceStatus: FunctionComponent<GovernedEntityComplianceStatusProps> =
    ({ data, entityType, onClick, getDisplayName }) => {
        const columnDefinition: Column<ComplianceStatusSummary>[] = useMemo(() => {
            return [
                ...getComplianceStatusColumnDefinition(
                    entityType,
                    onClick,
                    getDisplayName
                ),
            ];
        }, [entityType, onClick, getDisplayName]);

        return (
            <Box width="100%" mb={-2}>
                <Table
                    items={data}
                    disableRowSelect={true}
                    disableSettings={true}
                    {...(entityType === 'BUSINESS_UNIT' && {
                        disableExpand: false,
                        disableFilters: true,
                        disablePagination: true,
                    })}
                    columnDefinitions={columnDefinition}
                />
            </Box>
        );
    };

export default GovernedEntityComplianceStatus;
