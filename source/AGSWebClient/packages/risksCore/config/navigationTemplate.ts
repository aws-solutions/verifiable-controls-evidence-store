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
import { SideNavigationItemType } from 'aws-northstar/components/SideNavigation';
import { RestrictedSideNavigationItem } from '@ags/webclient-core/types';
import {
    ROUTE_RISKS_VIEW,
    ROUTE_CONTROL_OBJECTIVES_VIEW,
    ROUTE_CONTROL_TECHNIQUES_VIEW,
} from './routes';
import { PERMISSION_RISK_VIEW, PERMISSION_CONTROL_VIEW } from './permissions';
import { AGS_SERVICES_RISK_MANAGEMENT_SERVICE } from './constants';

const navigationTemplate: RestrictedSideNavigationItem[] = [
    {
        type: SideNavigationItemType.SECTION,
        text: 'Manage Risks',
        hideIfNoItem: true,
        items: [
            {
                type: SideNavigationItemType.LINK,
                text: 'Risks',
                href: ROUTE_RISKS_VIEW,
                restrictedGroups: PERMISSION_RISK_VIEW,
                requiredServices: [AGS_SERVICES_RISK_MANAGEMENT_SERVICE],
            },
            {
                type: SideNavigationItemType.LINK,
                text: 'Control Objectives',
                href: ROUTE_CONTROL_OBJECTIVES_VIEW,
                restrictedGroups: PERMISSION_RISK_VIEW,
                requiredServices: [AGS_SERVICES_RISK_MANAGEMENT_SERVICE],
            },
            {
                type: SideNavigationItemType.LINK,
                text: 'Control Techniques',
                href: ROUTE_CONTROL_TECHNIQUES_VIEW,
                restrictedGroups: PERMISSION_CONTROL_VIEW,
                requiredServices: [AGS_SERVICES_RISK_MANAGEMENT_SERVICE],
            },
        ],
        restrictedGroups: PERMISSION_RISK_VIEW,
        requiredServices: [AGS_SERVICES_RISK_MANAGEMENT_SERVICE],
    },
];

export default navigationTemplate;
