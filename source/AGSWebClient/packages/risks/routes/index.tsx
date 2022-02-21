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
import {
    ROUTE_RISK_CREATE,
    ROUTE_RISK_DETAILS,
    ROUTE_RISKS_VIEW,
    ROUTE_RISK_UPDATE,
    ROUTE_RISK_V2_CREATE,
    ROUTE_RISK_V2_DETAILS,
    ROUTE_RISKS_V2_VIEW,
    ROUTE_RISK_V2_UPDATE,
    ROUTE_CONTROL_OBJECTIVE_CREATE,
    ROUTE_CONTROL_OBJECTIVE_DETAILS,
    ROUTE_CONTROL_OBJECTIVES_VIEW,
    ROUTE_CONTROL_OBJECTIVE_UPDATE,
    ROUTE_CONTROL_TECHNIQUE_CREATE,
    ROUTE_CONTROL_TECHNIQUE_DETAILS,
    ROUTE_CONTROL_TECHNIQUES_VIEW,
    ROUTE_CONTROL_TECHNIQUE_UPDATE,
} from '@ags/webclient-risks-core/config/routes';
import {
    PERMISSION_RISK_MANAGE,
    PERMISSION_RISK_VIEW,
    PERMISSION_CONTROL_MANAGE,
    PERMISSION_CONTROL_VIEW,
} from '@ags/webclient-risks-core/config/permissions';

const Risks = lazy(() => import('../pages/Risks/List'));
const RiskDetail = lazy(() => import('../pages/Risks/Detail'));
const RiskCreate = lazy(() => import('../pages/Risks/Create'));
const RiskUpdate = lazy(() => import('../pages/Risks/Update'));

const RiskV2Detail = lazy(() => import('../pages/RisksV2/Detail'));
const RiskV2Create = lazy(() => import('../pages/RisksV2/Create'));
const RiskV2Update = lazy(() => import('../pages/RisksV2/Update'));
const RisksV2 = lazy(() => import('../pages/RisksV2/List'));

const ControlObjectiveDetail = lazy(() => import('../pages/ControlObjectives/Detail'));
const ControlObjectiveCreate = lazy(() => import('../pages/ControlObjectives/Create'));
const ControlObjectiveUpdate = lazy(() => import('../pages/ControlObjectives/Update'));
const ControlObjectives = lazy(() => import('../pages/ControlObjectives/List'));

const ControlTechniqueDetail = lazy(() => import('../pages/ControlTechniques/Detail'));
const ControlTechniqueCreate = lazy(() => import('../pages/ControlTechniques/Create'));
const ControlTechniqueUpdate = lazy(() => import('../pages/ControlTechniques/Update'));
const ControlTechniques = lazy(() => import('../pages/ControlTechniques/List'));

const routes = [
    {
        path: ROUTE_RISKS_V2_VIEW,
        Component: RisksV2,
        exact: true,
        restrictedGroups: PERMISSION_RISK_VIEW,
    },
    {
        path: ROUTE_RISK_V2_CREATE,
        Component: RiskV2Create,
        exact: true,
        restrictedGroups: PERMISSION_RISK_MANAGE,
    },
    {
        path: ROUTE_RISK_V2_UPDATE,
        Component: RiskV2Update,
        exact: true,
        restrictedGroups: PERMISSION_RISK_MANAGE,
    },
    {
        path: ROUTE_RISK_V2_DETAILS,
        Component: RiskV2Detail,
        exact: true,
        restrictedGroups: PERMISSION_RISK_VIEW,
    },
    {
        path: ROUTE_RISKS_VIEW,
        Component: Risks,
        exact: true,
        restrictedGroups: PERMISSION_RISK_VIEW,
    },
    {
        path: ROUTE_RISK_CREATE,
        Component: RiskCreate,
        exact: true,
        restrictedGroups: PERMISSION_RISK_MANAGE,
    },
    {
        path: ROUTE_RISK_UPDATE,
        Component: RiskUpdate,
        exact: true,
        restrictedGroups: PERMISSION_RISK_MANAGE,
    },
    {
        path: ROUTE_RISK_DETAILS,
        Component: RiskDetail,
        exact: true,
        restrictedGroups: PERMISSION_RISK_VIEW,
    },
    {
        path: ROUTE_CONTROL_OBJECTIVES_VIEW,
        Component: ControlObjectives,
        exact: true,
        restrictedGroups: PERMISSION_RISK_VIEW,
    },
    {
        path: ROUTE_CONTROL_OBJECTIVE_CREATE,
        Component: ControlObjectiveCreate,
        exact: true,
        restrictedGroups: PERMISSION_RISK_MANAGE,
    },
    {
        path: ROUTE_CONTROL_OBJECTIVE_DETAILS,
        Component: ControlObjectiveDetail,
        exact: true,
        restrictedGroups: PERMISSION_RISK_VIEW,
    },
    {
        path: ROUTE_CONTROL_OBJECTIVE_UPDATE,
        Component: ControlObjectiveUpdate,
        exact: true,
        restrictedGroups: PERMISSION_RISK_MANAGE,
    },
    {
        path: ROUTE_CONTROL_TECHNIQUES_VIEW,
        Component: ControlTechniques,
        exact: true,
        restrictedGroups: PERMISSION_CONTROL_VIEW,
    },
    {
        path: ROUTE_CONTROL_TECHNIQUE_CREATE,
        Component: ControlTechniqueCreate,
        exact: true,
        restrictedGroups: PERMISSION_CONTROL_MANAGE,
    },
    {
        path: ROUTE_CONTROL_TECHNIQUE_DETAILS,
        Component: ControlTechniqueDetail,
        exact: true,
        restrictedGroups: PERMISSION_CONTROL_VIEW,
    },
    {
        path: ROUTE_CONTROL_TECHNIQUE_UPDATE,
        Component: ControlTechniqueUpdate,
        exact: true,
        restrictedGroups: PERMISSION_CONTROL_MANAGE,
    },
];

export default routes;
