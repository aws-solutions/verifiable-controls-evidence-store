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
import { ROUTE_ESTATES_VIEW, ROUTE_ENVCLASSES_VIEW } from './routes';
import { PERMISSION_ESTATE_VIEW, PERMISSION_ENVCLASS_VIEW } from './permissions';
import { AGS_SERVICES_ESTATE_MANAGEMENT_SERVICE } from './constants';

const navigationTemplate: RestrictedSideNavigationItem[] = [
    {
        type: SideNavigationItemType.SECTION,
        text: 'Manage Entities',
        hideIfNoItem: true,
        items: [
            {
                type: SideNavigationItemType.LINK,
                text: 'Estates',
                href: ROUTE_ESTATES_VIEW,
                restrictedGroups: PERMISSION_ESTATE_VIEW,
                requiredServices: [AGS_SERVICES_ESTATE_MANAGEMENT_SERVICE],
            },
            {
                type: SideNavigationItemType.LINK,
                text: 'Environment Classes',
                href: ROUTE_ENVCLASSES_VIEW,
                restrictedGroups: PERMISSION_ENVCLASS_VIEW,
                requiredServices: [AGS_SERVICES_ESTATE_MANAGEMENT_SERVICE],
            },
        ],
    },
];

export default navigationTemplate;
