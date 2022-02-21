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
    ROUTE_EVIDENCE_PROVIDERS_VIEW,
    ROUTE_EVIDENCE_PROVIDER_CREATE,
    ROUTE_EVIDENCE_PROVIDER_DETAILS,
    ROUTE_SCHEMA_DETAILS,
    ROUTE_EVIDENCE_VIEW,
    ROUTE_EVIDENCE_DETAIL,
    ROUTE_EVIDENCE_CREATE,
    ROUTE_EVIDENCE_REVISION_DETAIL,
    ROUTE_CREATE_SCHEMA,
} from '@ags/webclient-evidence-core/config/routes';
import {
    PERMISSION_EVIDENCE_VIEW,
    PERMISSION_EVIDENCE_PROVIDERS_VIEW,
    PERMISSION_EVIDENCE_MANAGE,
    PERMISSION_EVIDENCE_PROVIDER_MANAGE,
} from '@ags/webclient-evidence-core/config/permissions';
import { CreateSchemaView } from '../pages/EvidenceProvider/SchemaCreate';
const EvidenceProviders = lazy(() => import('../pages/EvidenceProvider'));
const EvidenceProviderView = lazy(() => import('../pages/EvidenceProvider/Detail'));
const Evidence = lazy(() => import('../pages/Evidence'));
const EvidenceDetailView = lazy(() => import('../pages/Evidence/Detail'));
const CreateEvidence = lazy(() => import('../pages/Evidence/Create'));
const CreateEvidenceProvider = lazy(() => import('../pages/EvidenceProvider/Create'));
const EvidenceProviderSchemaView = lazy(
    () => import('../pages/EvidenceProvider/SchemaDetails')
);

const routes = [
    {
        path: ROUTE_EVIDENCE_PROVIDERS_VIEW,
        Component: EvidenceProviders,
        exact: true,
        restrictedGroups: PERMISSION_EVIDENCE_PROVIDERS_VIEW,
    },
    {
        path: ROUTE_EVIDENCE_PROVIDER_CREATE,
        Component: CreateEvidenceProvider,
        exact: true,
        restrictedGroups: PERMISSION_EVIDENCE_PROVIDER_MANAGE,
    },
    {
        path: ROUTE_EVIDENCE_PROVIDER_DETAILS,
        Component: EvidenceProviderView,
        exact: true,
        restrictedGroups: PERMISSION_EVIDENCE_PROVIDERS_VIEW,
    },
    {
        path: ROUTE_SCHEMA_DETAILS,
        Component: EvidenceProviderSchemaView,
        exact: true,
        restrictedGroups: PERMISSION_EVIDENCE_PROVIDERS_VIEW,
    },
    {
        path: ROUTE_EVIDENCE_VIEW,
        Component: Evidence,
        exact: true,
        restrictedGroups: PERMISSION_EVIDENCE_VIEW,
    },
    {
        path: ROUTE_EVIDENCE_CREATE,
        Component: CreateEvidence,
        exact: true,
        restrictedGroups: PERMISSION_EVIDENCE_MANAGE,
    },
    {
        path: ROUTE_EVIDENCE_DETAIL,
        Component: EvidenceDetailView,
        exact: true,
        restrictedGroups: PERMISSION_EVIDENCE_VIEW,
    },
    {
        path: ROUTE_EVIDENCE_REVISION_DETAIL,
        Component: EvidenceDetailView,
        exact: true,
        restrictedGroups: PERMISSION_EVIDENCE_VIEW,
    },

    {
        path: ROUTE_CREATE_SCHEMA,
        Component: CreateSchemaView,
        exact: true,
        restrictedGroups: PERMISSION_EVIDENCE_PROVIDER_MANAGE,
    },
];

export default routes;
