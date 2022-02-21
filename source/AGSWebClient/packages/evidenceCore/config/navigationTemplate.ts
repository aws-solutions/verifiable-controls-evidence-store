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
import { ROUTE_EVIDENCE_PROVIDERS_VIEW, ROUTE_EVIDENCE_VIEW } from './routes';
import {
    PERMISSION_EVIDENCE_PROVIDERS_VIEW,
    PERMISSION_EVIDENCE_VIEW,
} from './permissions';
import { AGS_SERVICES_EVIDENCE_STORE } from './constants';

const navigationTemplate: RestrictedSideNavigationItem[] = [
    {
        type: SideNavigationItemType.SECTION,
        text: 'Evidence',
        hideIfNoItem: true,
        items: [
            {
                type: SideNavigationItemType.LINK,
                text: 'Evidence Providers',
                href: ROUTE_EVIDENCE_PROVIDERS_VIEW,
                restrictedGroups: PERMISSION_EVIDENCE_PROVIDERS_VIEW,
                requiredServices: [AGS_SERVICES_EVIDENCE_STORE],
            },

            {
                type: SideNavigationItemType.LINK,
                text: 'Evidences',
                href: ROUTE_EVIDENCE_VIEW,
                restrictedGroups: PERMISSION_EVIDENCE_VIEW,
                requiredServices: [AGS_SERVICES_EVIDENCE_STORE],
            },
        ],
        restrictedGroups: PERMISSION_EVIDENCE_PROVIDERS_VIEW,
        requiredServices: [AGS_SERVICES_EVIDENCE_STORE],
    },
];

export default navigationTemplate;
