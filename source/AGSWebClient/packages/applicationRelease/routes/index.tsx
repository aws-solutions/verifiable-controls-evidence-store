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
    ROUTE_APPLICATION_CREATE,
    ROUTE_APPLICATION_DETAILS,
    ROUTE_APPLICATIONS_VIEW,
    ROUTE_APPLICATION_UPDATE,
    ROUTE_ATTRIBUTE_CREATE,
    ROUTE_ATTRIBUTE_DETAILS,
    ROUTE_ATTRIBUTES_VIEW,
    ROUTE_ATTRIBUTE_UPDATE,
    ROUTE_RELEASE_CANDIDATE_DETAILS,
} from '@ags/webclient-application-release-core/config/routes';
import {
    PERMISSION_APPLICATION_MANAGE,
    PERMISSION_APPLICATION_VIEW,
    PERMISSION_ATTRIBUTE_MANAGE,
    PERMISSION_ATTRIBUTE_VIEW,
} from '@ags/webclient-application-release-core/config/permissions';

const ApplicationDetail = lazy(() => import('../pages/Applications/Detail'));
const ApplicationCreate = lazy(() => import('../pages/Applications/Create'));
const ApplicationUpdate = lazy(() => import('../pages/Applications/Update'));
const Applications = lazy(() => import('../pages/Applications/List'));
const ReleaseCandidateDetail = lazy(() => import('../pages/ReleaseCandidates/Detail'));

const AttributeDetail = lazy(() => import('../pages/Attributes/Detail'));
const AttributeCreate = lazy(() => import('../pages/Attributes/Create'));
const AttributeUpdate = lazy(() => import('../pages/Attributes/Update'));
const Attributes = lazy(() => import('../pages/Attributes/List'));

const routes = [
    {
        path: ROUTE_APPLICATIONS_VIEW,
        Component: Applications,
        exact: true,
        restrictedGroups: PERMISSION_APPLICATION_VIEW,
    },
    {
        path: ROUTE_APPLICATION_CREATE,
        Component: ApplicationCreate,
        exact: true,
        restrictedGroups: PERMISSION_APPLICATION_MANAGE,
    },
    {
        path: ROUTE_APPLICATION_DETAILS,
        Component: ApplicationDetail,
        exact: true,
        restrictedGroups: PERMISSION_APPLICATION_VIEW,
    },
    {
        path: ROUTE_APPLICATION_UPDATE,
        Component: ApplicationUpdate,
        exact: true,
        restrictedGroups: PERMISSION_APPLICATION_MANAGE,
    },
    {
        path: ROUTE_RELEASE_CANDIDATE_DETAILS,
        Component: ReleaseCandidateDetail,
        exact: true,
        restrictedGroups: PERMISSION_APPLICATION_MANAGE,
    },
    {
        path: ROUTE_ATTRIBUTES_VIEW,
        Component: Attributes,
        exact: true,
        restrictedGroups: PERMISSION_ATTRIBUTE_VIEW,
    },
    {
        path: ROUTE_ATTRIBUTE_CREATE,
        Component: AttributeCreate,
        exact: true,
        restrictedGroups: PERMISSION_ATTRIBUTE_MANAGE,
    },
    {
        path: ROUTE_ATTRIBUTE_DETAILS,
        Component: AttributeDetail,
        exact: true,
        restrictedGroups: PERMISSION_ATTRIBUTE_VIEW,
    },
    {
        path: ROUTE_ATTRIBUTE_UPDATE,
        Component: AttributeUpdate,
        exact: true,
        restrictedGroups: PERMISSION_ATTRIBUTE_MANAGE,
    },
];

export default routes;
