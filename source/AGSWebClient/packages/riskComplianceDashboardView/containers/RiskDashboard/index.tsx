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
import ColumnLayout from 'aws-northstar/layouts/ColumnLayout';
import RiskCategoryDashboard from '../../components/RiskDashboard/Category';
import RiskImpactDashboard from '../../components/RiskDashboard/Impact';
import RiskMitigationStatusDashboard from '../../components/RiskDashboard/MitigationStatus';
import ImpactHeatMaps from '../../components/RiskDashboard/ImpactHeatmaps';

import { DashboardWidgetProps } from '../RiskComplianceDashboard/types';

const RiskDashboard: FunctionComponent<DashboardWidgetProps> = () => {
    return (
        <Box width="100%">
            <ColumnLayout renderDivider={false}>
                <RiskCategoryDashboard key="riskCategory" />
                <RiskMitigationStatusDashboard key="riskMigation" />
                <RiskImpactDashboard key="riskImpact" />
            </ColumnLayout>
            <ImpactHeatMaps />
        </Box>
    );
};

export default RiskDashboard;
