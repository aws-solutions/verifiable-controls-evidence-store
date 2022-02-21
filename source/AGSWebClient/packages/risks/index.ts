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
import navigationTemplate from '@ags/webclient-risks-core/config/navigationTemplate';
import routes from './routes';
import { queryMap, mutationMap } from '@ags/webclient-risks-core/queries';

const ControlObjectives = lazy(() => import('./pages/ControlObjectives/List'));

const appModuleConfig: AppModuleConfig = {
    name: 'risks',
    queryMap,
    mutationMap,
    navigationTemplate,
    canRunAsStandaloneMode: true,
    routes,
    customSettingsOverride: {
        DashboardComponent: ControlObjectives,
        renderNavigationPanel: true,
        appHeader: 'AWS Governance Suite Risk Management',
        navHeader: 'AGS Risk Management',
        htmlPageTitle: 'Risk Management',
    },
};

export default appModuleConfig;
