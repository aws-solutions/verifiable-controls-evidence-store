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
    ROUTE_ENVCLASSES_VIEW,
    ROUTE_ENVCLASS_CREATE,
    ROUTE_ESTATES_VIEW,
    ROUTE_ESTATE_DETAILS,
    ROUTE_ESTATE_REQUEST_FROM_ESTATES,
} from '@ags/webclient-estates-core/config/routes';
import {
    PERMISSION_ENVCLASS_MANAGE,
    PERMISSION_ENVCLASS_VIEW,
    PERMISSION_ESTATE_MANAGE,
    PERMISSION_ESTATE_VIEW,
} from '@ags/webclient-estates-core/config/permissions';
const Estates = lazy(() => import('../pages/Estates'));
const EstateCreate = lazy(() => import('../pages/Estates/Create'));
const Estate = lazy(() => import('../pages/Estates/Detail'));
const EnvClassesView = lazy(() => import('../pages/EnvClasses'));
const EnvClassCreate = lazy(() => import('../pages/EnvClasses/Create'));

const routes = [
    {
        path: ROUTE_ENVCLASSES_VIEW,
        Component: EnvClassesView,
        exact: true,
        restrictedGroups: PERMISSION_ENVCLASS_VIEW,
    },
    {
        path: ROUTE_ENVCLASS_CREATE,
        Component: EnvClassCreate,
        exact: true,
        restrictedGroups: PERMISSION_ENVCLASS_MANAGE,
    },
    {
        path: ROUTE_ESTATES_VIEW,
        Component: Estates,
        exact: true,
        restrictedGroups: PERMISSION_ESTATE_VIEW,
    },
    {
        path: ROUTE_ESTATE_REQUEST_FROM_ESTATES,
        Component: EstateCreate,
        exact: true,
        restrictedGroups: PERMISSION_ESTATE_MANAGE,
    },
    {
        path: ROUTE_ESTATE_DETAILS,
        Component: Estate,
        exact: true,
        restrictedGroups: PERMISSION_ESTATE_VIEW,
    },
];

export default routes;
