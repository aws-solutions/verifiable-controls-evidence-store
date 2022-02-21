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
import { AppModuleConfig } from '@ags/webclient-core/types';
import navigationTemplate from '@ags/webclient-application-release-core/config/navigationTemplate';
import routes from './routes';
import { queryMap, mutationMap } from '@ags/webclient-application-release-core/queries';

const Applications = lazy(() => import('./pages/Applications/List'));

const appModuleConfig: AppModuleConfig = {
    name: 'applicationRelease',
    queryMap,
    mutationMap,
    navigationTemplate,
    canRunAsStandaloneMode: true,
    routes,
    customSettingsOverride: {
        DashboardComponent: Applications,
        renderNavigationPanel: true,
        appHeader: 'AWS Governance Suite Application Release Management',
        navHeader: 'AGS Application Release Management',
        htmlPageTitle: 'Application Release Management',
    },
};

export default appModuleConfig;
