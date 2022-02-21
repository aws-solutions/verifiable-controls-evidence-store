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
import { lazy } from 'react';
import { PERMISSION_RISK_VIEW } from '@ags/webclient-risks-core/config/permissions';

import {
    ROUTE_GOVERNED_ENTITIES_VIEW,
    ROUTE_GOVERNED_ENTITY_UPDATE,
} from '@ags/webclient-governed-entity-core/config/routes';

const GovernedEntities = lazy(() => import('../pages'));
const GovernedEntityUpdate = lazy(() => import('../pages/Update'));

const routes = [
    {
        path: ROUTE_GOVERNED_ENTITIES_VIEW,
        Component: GovernedEntities,
        exact: true,
        restrictedGroups: PERMISSION_RISK_VIEW,
    },
    {
        path: ROUTE_GOVERNED_ENTITY_UPDATE,
        Component: GovernedEntityUpdate,
        exact: true,
        restrictedGroups: PERMISSION_RISK_VIEW,
    },
];

export default routes;
