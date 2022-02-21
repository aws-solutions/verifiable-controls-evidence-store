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
import { useGovSuiteAppApi } from '../../containers/AppContext';
import { UserGroup } from '../../types';

export interface HasGroupsProps {
    groups: UserGroup[];
    children: any;
}

/**
 * Usage:
 * <HasGroups groups={[...]}>Things to Render</HasGroups>
 *
 * @param groups list of UserGroup to check.
 * @param children elements to render if user is in at least one of the groups passed in.
 * @constructor
 */
const HasGroups: FunctionComponent<HasGroupsProps> = ({ groups, children }) => {
    const { userGroups = [] } = useGovSuiteAppApi();
    return userGroups.some(
        (userGroup) => userGroup === UserGroup.SystemAdmin || groups.includes(userGroup)
    ) ? (
        <>{children}</>
    ) : null;
};

export default HasGroups;
