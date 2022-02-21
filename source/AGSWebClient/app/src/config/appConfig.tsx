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
//import { lazy } from 'react';
import { SideNavigationItemType } from 'aws-northstar/components/SideNavigation';
import { AppConfig } from '@ags/webclient-core/types';
import evidence from '@ags/webclient-evidence';
import estates from '@ags/webclient-estates';
import businessUnits from '@ags/webclient-business-units';
import risks from '@ags/webclient-risks';
import applicationRelease from '@ags/webclient-application-release';
import governedEntity from '@ags/webclient-governed-entity';
import {
    ROUTE_BUSINESS_UNIT_DETAILS,
    ROUTE_ENTERPRISE_DETAILS,
} from '@ags/webclient-business-units-core/config/routes';
import { ROUTE_GOVERNED_ENTITIES_VIEW } from '@ags/webclient-governed-entity-core/config/routes';
import { ROUTE_ESTATE_DETAILS } from '@ags/webclient-estates-core/config/routes';
import { queryMap as complianceQueryMap } from '@ags/webclient-compliance-core/queries';
import { queryMap as applicationsQueryMap } from '@ags/webclient-applications-core/queries';
import { AGS_SERVICES_RISK_MANAGEMENT_SERVICE } from '@ags/webclient-risks-core/config/constants';
import { PERMISSION_RISK_VIEW } from '@ags/webclient-risks-core/config/permissions';
import {
    EnterpriseDetailsWithRiskComplianceDashboard,
    EstateDetailsWithRiskComplianceDashboard,
    BusinessUnitDetailsWithRiskComplianceDashboard,
} from '../containers/DetailsWithRiskComplianceDashboard';

// const GovernanceHub = lazy(
//     () => import('@ags/webclient-governance-hub-view/pages/GovernanceHub')
// );

const appConfig: AppConfig = {
    // customSettingsOverride: {
    //     DashboardComponent: GovernanceHub,
    // },
    queryMapOverride: {
        ...complianceQueryMap,
        ...applicationsQueryMap,
    },
    routesOverride: [
        {
            path: ROUTE_ENTERPRISE_DETAILS,
            Component: EnterpriseDetailsWithRiskComplianceDashboard,
            exact: true,
            secure: true,
        },
        {
            path: ROUTE_BUSINESS_UNIT_DETAILS,
            Component: BusinessUnitDetailsWithRiskComplianceDashboard,
            exact: true,
            secure: true,
        },
        {
            path: ROUTE_ESTATE_DETAILS,
            Component: EstateDetailsWithRiskComplianceDashboard,
            exact: true,
            secure: true,
        },
    ],
    navigationTemplateOverrideFunc: (navTemplate) => {
        return navTemplate.map((nav) => {
            if (nav.text !== 'Manage Risks') {
                return nav;
            }

            // Add Governed Entity Associations to the Risks Nav Section
            return {
                ...nav,
                items: [
                    ...(nav.items || []),
                    {
                        type: SideNavigationItemType.LINK,
                        text: 'Governed Entity Associations',
                        href: ROUTE_GOVERNED_ENTITIES_VIEW,
                        restrictedGroups: PERMISSION_RISK_VIEW,
                        requiredServices: [AGS_SERVICES_RISK_MANAGEMENT_SERVICE],
                    },
                ],
            };
        });
    },
    modules: [
        businessUnits,
        estates,
        risks,
        evidence,
        applicationRelease,
        governedEntity,
    ],
};

export default appConfig;
