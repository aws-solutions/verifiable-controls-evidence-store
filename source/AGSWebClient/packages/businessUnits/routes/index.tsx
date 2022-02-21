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
    ROUTE_ENTERPRISE_CREATE,
    ROUTE_ENTERPRISE_UPDATE,
    ROUTE_ENTERPRISE_DETAILS,
    ROUTE_BUSINESS_UNIT_CREATE,
    ROUTE_BUSINESS_UNIT_CREATE_WITH_PARENT,
    ROUTE_BUSINESS_UNIT_DETAILS,
    ROUTE_BUSINESS_UNIT_UPDATE,
} from '@ags/webclient-business-units-core/config/routes';
import {
    PERMISSION_ENTERPRISE_MANAGE,
    PERMISSION_ENTERPRISE_VIEW,
    PERMISSION_BUSINESS_UNIT_MANAGE,
    PERMISSION_BUSINESS_UNIT_VIEW,
} from '@ags/webclient-business-units-core/config/permissions';

const EnterpriseCreate = lazy(() => import('../pages/Enterprise/Create'));
const EnterpriseUpdate = lazy(() => import('../pages/Enterprise/Update'));
const EnterpriseDetails = lazy(() => import('../pages/Enterprise/Details'));
const BusinessUnitDetail = lazy(() => import('../pages/BusinessUnits/Detail'));
const BusinessUnitCreate = lazy(() => import('../pages/BusinessUnits/Create'));
const BusinessUnitCreateWithParent = lazy(
    () => import('../pages/BusinessUnits/CreateWithParent')
);
const BusinessUnitUpdate = lazy(() => import('../pages/BusinessUnits/Update'));

const routes = [
    {
        path: ROUTE_ENTERPRISE_CREATE,
        Component: EnterpriseCreate,
        exact: true,
        restrictedGroups: PERMISSION_ENTERPRISE_MANAGE,
    },
    {
        path: ROUTE_ENTERPRISE_UPDATE,
        Component: EnterpriseUpdate,
        exact: true,
        restrictedGroups: PERMISSION_ENTERPRISE_MANAGE,
    },
    {
        path: ROUTE_ENTERPRISE_DETAILS,
        Component: EnterpriseDetails,
        exact: true,
        restrictedGroups: PERMISSION_ENTERPRISE_VIEW,
    },
    {
        path: ROUTE_BUSINESS_UNIT_CREATE,
        Component: BusinessUnitCreate,
        exact: true,
        restrictedGroups: PERMISSION_BUSINESS_UNIT_MANAGE,
    },
    {
        path: ROUTE_BUSINESS_UNIT_CREATE_WITH_PARENT,
        Component: BusinessUnitCreateWithParent,
        exact: true,
        restrictedGroups: PERMISSION_BUSINESS_UNIT_MANAGE,
    },
    {
        path: ROUTE_BUSINESS_UNIT_UPDATE,
        Component: BusinessUnitUpdate,
        exact: true,
        restrictedGroups: PERMISSION_BUSINESS_UNIT_MANAGE,
    },
    {
        path: ROUTE_BUSINESS_UNIT_DETAILS,
        Component: BusinessUnitDetail,
        exact: true,
        restrictedGroups: PERMISSION_BUSINESS_UNIT_VIEW,
    },
];

export default routes;
