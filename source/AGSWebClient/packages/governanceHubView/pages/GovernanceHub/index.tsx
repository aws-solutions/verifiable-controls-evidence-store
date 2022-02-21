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
import { FunctionComponent, useEffect } from 'react';

import Stack from 'aws-northstar/layouts/Stack';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import { useGovSuiteAppApi } from '@ags/webclient-core/containers/AppContext';
import { UserGroup } from '@ags/webclient-core/types';

import GovernenceHubHelpPanel from '../../components/HelpPanel';
import EnterpriseDetails from '@ags/webclient-business-units-view/containers/EnterpriseDetails';
import ControlTechniques from '@ags/webclient-risks-view/containers/ControlTechniques';
import ControlObjectives from '@ags/webclient-risks-view/containers/ControlObjectives';
import RiskComplianceDashboard from '@ags/webclient-risk-compliance-dashboard-view';

export interface GovernanceHubProps {}

// Render the view based on the user group. The order is matter when the users belongs to more than one groups.
const renderCustomContent = (userGroups: UserGroup[]) => {
    if (
        userGroups?.includes(UserGroup.DomainOwner) ||
        userGroups?.includes(UserGroup.SystemAdmin)
    ) {
        return <EnterpriseDetails DashboardComponent={RiskComplianceDashboard} />;
    }

    if (userGroups?.includes(UserGroup.ApplicationOwner)) {
        return <EnterpriseDetails DashboardComponent={RiskComplianceDashboard} />;
    }

    if (userGroups?.includes(UserGroup.ControlOwner)) {
        return <ControlTechniques />;
    }

    if (userGroups?.includes(UserGroup.EvidenceProvider)) {
        return <EnterpriseDetails DashboardComponent={RiskComplianceDashboard} />;
    }

    if (userGroups?.includes(UserGroup.ChiefRiskOffice)) {
        return <ControlObjectives />;
    }

    if (userGroups?.includes(UserGroup.Line1Risk)) {
        return <ControlObjectives />;
    }

    if (userGroups?.includes(UserGroup.Line2Risk)) {
        return <ControlObjectives />;
    }

    if (userGroups?.includes(UserGroup.Line3Risk)) {
        return <ControlObjectives />;
    }

    if (userGroups?.includes(UserGroup.ApplicationDeveloper)) {
        return <EnterpriseDetails DashboardComponent={RiskComplianceDashboard} />;
    }

    return <EnterpriseDetails DashboardComponent={RiskComplianceDashboard} />;
};

const GovernanceHub: FunctionComponent<GovernanceHubProps> = () => {
    const { userGroups } = useGovSuiteAppApi();
    const { setHelpPanelContent } = useAppLayoutContext();

    useEffect(() => {
        setHelpPanelContent(<GovernenceHubHelpPanel />);

        return () => {
            setHelpPanelContent(null);
        };
    }, [setHelpPanelContent]);

    useEffect(() => {}, []);

    return <Stack>{renderCustomContent(userGroups)}</Stack>;
};

export default GovernanceHub;
