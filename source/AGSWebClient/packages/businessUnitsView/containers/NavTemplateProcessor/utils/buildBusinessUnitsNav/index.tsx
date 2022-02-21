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
import { generatePath } from 'react-router-dom';
import { SideNavigationItemType } from 'aws-northstar/components/SideNavigation';
import {
    ROUTE_ENTERPRISE_CREATE,
    ROUTE_ENTERPRISE_DETAILS,
    ROUTE_BUSINESS_UNIT_DETAILS,
} from '@ags/webclient-business-units-core/config/routes';
import { RestrictedSideNavigationItem } from '@ags/webclient-core/types';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import {
    PERMISSION_BUSINESS_UNIT_VIEW,
    PERMISSION_ENTERPRISE_MANAGE,
} from '@ags/webclient-business-units-core/config/permissions';
import { AGS_SERVICES_RISK_MANAGEMENT_SERVICE } from '@ags/webclient-business-units-core/config/constants';

const RESTRICTED_GROUPS = PERMISSION_BUSINESS_UNIT_VIEW;
const RESTRICTED_SERVICES = [AGS_SERVICES_RISK_MANAGEMENT_SERVICE];

/**
 * Build the nav items for Business units section.
 * */
const buildBusinessUnitItems = (
    parentItem: RestrictedSideNavigationItem,
    parentUnitId: string,
    businessUnits: BusinessUnitSummary[]
): RestrictedSideNavigationItem => {
    const children = businessUnits
        .filter(({ parentId }) => parentId && parentId === parentUnitId)
        .sort((a, b) => {
            let nameA = a.name.toUpperCase(); // ignore upper and lowercase
            let nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }

            // names must be equal
            return 0;
        });

    if (children.length > 0) {
        children.forEach(({ id, name }) => {
            const navItem: RestrictedSideNavigationItem = {
                type: SideNavigationItemType.LINK,
                text: name,
                href: generatePath(ROUTE_BUSINESS_UNIT_DETAILS, {
                    businessUnitId: id,
                }),
                items: [],
            };
            buildBusinessUnitItems(navItem, id, businessUnits);
            if (navItem.items!.length > 0) {
                navItem.type = SideNavigationItemType.SECTION;
            }
            parentItem.items!.push(navItem);
        });
    }
    return parentItem;
};

export const buildBusinessUnitsNav = (businessUnits: BusinessUnitSummary[]) => {
    if (businessUnits) {
        const enterprise = businessUnits.find(
            ({ unitType }) => unitType === 'Enterprise'
        );

        // if there no enterprise, show create enterprise link
        if (!enterprise) {
            return {
                type: SideNavigationItemType.LINK,
                text: 'Create Enterprise',
                href: ROUTE_ENTERPRISE_CREATE,
                restrictedGroups: PERMISSION_ENTERPRISE_MANAGE,
                requiredServices: RESTRICTED_SERVICES,
            };
        }

        const enterpriseItem: RestrictedSideNavigationItem = {
            type: SideNavigationItemType.SECTION,
            text: `${enterprise.name}`,
            href: ROUTE_ENTERPRISE_DETAILS,
            items: [],
            restrictedGroups: RESTRICTED_GROUPS,
            requiredServices: RESTRICTED_SERVICES,
        };

        return buildBusinessUnitItems(enterpriseItem, enterprise.id, businessUnits);
    } else {
        return {
            type: SideNavigationItemType.LINK,
            text: 'Create Enterprise',
            href: ROUTE_ENTERPRISE_CREATE,
            restrictedGroups: PERMISSION_ENTERPRISE_MANAGE,
            requiredServices: RESTRICTED_SERVICES,
        };
    }
};
