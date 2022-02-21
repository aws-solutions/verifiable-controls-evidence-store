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
import { ROUTE_APPLICATIONS_VIEW, ROUTE_ATTRIBUTES_VIEW } from './routes';
import { PERMISSION_APPLICATION_VIEW, PERMISSION_ATTRIBUTE_VIEW } from './permissions';
import {
    AGS_SERVICES_APPLICATION_DEFINITION_SERVICE,
    AGS_SERVICES_RELEASE_MANAGEMENT_SERVICE,
} from './constants';

const navigationTemplate: RestrictedSideNavigationItem[] = [
    {
        type: SideNavigationItemType.SECTION,
        text: 'Manage Entities',
        hideIfNoItem: true,
        items: [
            {
                type: SideNavigationItemType.LINK,
                text: 'Applications',
                href: ROUTE_APPLICATIONS_VIEW,
                restrictedGroups: PERMISSION_APPLICATION_VIEW,
                requiredServices: [
                    AGS_SERVICES_APPLICATION_DEFINITION_SERVICE,
                    AGS_SERVICES_RELEASE_MANAGEMENT_SERVICE,
                ],
            },
            {
                type: SideNavigationItemType.LINK,
                text: 'Attributes',
                href: ROUTE_ATTRIBUTES_VIEW,
                restrictedGroups: PERMISSION_ATTRIBUTE_VIEW,
                requiredServices: [
                    AGS_SERVICES_APPLICATION_DEFINITION_SERVICE,
                    AGS_SERVICES_RELEASE_MANAGEMENT_SERVICE,
                ],
            },
        ],
    },
];

export default navigationTemplate;
