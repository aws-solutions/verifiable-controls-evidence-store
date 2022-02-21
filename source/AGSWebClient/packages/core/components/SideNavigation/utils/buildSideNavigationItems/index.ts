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
import { UserGroup, RestrictedSideNavigationItem } from '../../../../types';
import {
    SideNavigationItem,
    SideNavigationItemType,
} from 'aws-northstar/components/SideNavigation';
import { SideNavigationBuildData } from '../../types';

/**
 * return the side navigation structure matching restricted groups and having the AGS service available
 *
 * @param {UserGroup[]} userGroups
 * @returns {SideNavigation[]}
 */
const buildSideNavigationItems = (
    data: SideNavigationBuildData
): SideNavigationItem[] => {
    const sideNav: SideNavigationItem[] = [];

    const pushItem = (obj: RestrictedSideNavigationItem, parent?: SideNavigationItem) => {
        const navItem = {
            ...obj,
            items: obj.type === SideNavigationItemType.SECTION ? [] : obj.items,
        };

        // should push nav item to the list
        let shouldPushNavItem = true;

        if (navItem.type === SideNavigationItemType.SECTION && obj.items?.length) {
            iterate(obj.items, navItem);

            shouldPushNavItem =
                shouldPushNavItem &&
                (!obj.hideIfNoItem || (!!navItem.items && navItem.items?.length > 0));
        }

        if (shouldPushNavItem) {
            (parent?.items || sideNav).push(navItem);
        }
    };

    const iterate = (obj: any, parent?: SideNavigationItem) => {
        /** the final side nav  */
        Object.keys(obj).forEach((key) => {
            let visible = true;

            /** is this restricted  */
            const restrictedGroups = obj[key].restrictedGroups;
            if (restrictedGroups) {
                /** are there valid intersecting groups */
                const intersection = !!data.userGroups?.some(
                    (userGroup: UserGroup) =>
                        userGroup === UserGroup.SystemAdmin ||
                        restrictedGroups.includes(userGroup)
                );
                /** are we allowed ? */
                visible = visible && intersection;
            }

            /** does the service endpoint exist */
            const requiredServices = obj[key].requiredServices;
            if (requiredServices) {
                visible =
                    visible &&
                    data.apiEndpoints &&
                    requiredServices.every((service: string) =>
                        Object.keys(data.apiEndpoints!).includes(service)
                    );
            }

            if (visible) {
                /** push into the sideNav */

                pushItem(obj[key], parent);
            }
        });
    };
    iterate(data.navigationTemplate);
    return sideNav;
};

export default buildSideNavigationItems;
