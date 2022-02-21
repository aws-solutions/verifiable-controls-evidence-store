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

import EnterpriseDetails from '@ags/webclient-business-units-view/containers/EnterpriseDetails';
import BusinessUnitDetails from '@ags/webclient-business-units-view/containers/BusinessUnitDetails';
import EstateDetails from '@ags/webclient-estates-view/containers/Detail';
import RiskComplianceDashboard from '@ags/webclient-risk-compliance-dashboard-view/index';

export const EnterpriseDetailsWithRiskComplianceDashboard = () => (
    <EnterpriseDetails DashboardComponent={RiskComplianceDashboard} />
);
export const BusinessUnitDetailsWithRiskComplianceDashboard = () => (
    <BusinessUnitDetails DashboardComponent={RiskComplianceDashboard} />
);

export const EstateDetailsWithRiskComplianceDashboard = () => (
    <EstateDetails DashboardComponent={RiskComplianceDashboard} />
);
