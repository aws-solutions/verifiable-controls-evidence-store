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
import { DashboardWidgetProps } from '../RiskComplianceDashboard/types';
import Box from 'aws-northstar/layouts/Box';
import ComplianceDataLoader from './components/ComplianceDataLoader';
import MetadataLoader from './components/MetadataLoader';
import DashboardView from './components/DashboardView';

const ComplianceDashboardContainer: FunctionComponent<DashboardWidgetProps> = ({
    filter,
    envClass,
    entityType,
    entityId,
}) => {
    return (
        <Box width="100%">
            <Box mb={1} width="100%">
                {filter}
            </Box>
            {envClass && (
                <ComplianceDataLoader
                    envClass={envClass}
                    entityType={entityType}
                    entityId={entityId}
                >
                    {(complianceData, rawData) => (
                        <MetadataLoader data={complianceData}>
                            {(entityMaps) => (
                                <DashboardView
                                    entityId={entityId}
                                    entityType={entityType}
                                    complianceData={complianceData}
                                    rawData={rawData}
                                    entityMaps={entityMaps}
                                />
                            )}
                        </MetadataLoader>
                    )}
                </ComplianceDataLoader>
            )}
        </Box>
    );
};

export default ComplianceDashboardContainer;
