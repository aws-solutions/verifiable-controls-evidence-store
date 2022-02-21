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
import { ComponentType, lazy } from 'react';
import { SideNavigationItemType } from 'aws-northstar/components/SideNavigation';
import {
    AppSettings,
    AppCustomSettings,
    AppConfig,
    Route,
    RestrictedSideNavigationItem,
    AppModuleConfig,
    StandaloneAppModuleConfig,
} from '../../types';
import { ROUTE_DASHBOARD, ROUTE_GET_STARTED } from '../../config/routes';
import HomePage from '../../components/HomePage';

import { ProcessorProps } from '../../components/ProcessorList';

const GetStarted = lazy(() => import('../../containers/GetStarted'));

const defaultAppCustomSettings: AppCustomSettings = {
    renderNavigationPanel: true,
    DashboardComponent: HomePage,
    HomeComponent: GetStarted,
};

const arrayUnion = (arr1: any[], arr2: any[], getId: (item: any) => string) => {
    if (arr1.length === 0) {
        return arr2;
    }

    if (arr2.length === 0) {
        return arr1;
    }

    var union = arr1.concat(arr2);

    for (var i = 0; i < union.length; i++) {
        for (var j = i + 1; j < union.length; j++) {
            if (getId(union[i]) === getId(union[j])) {
                union.splice(j, 1);
                j--;
            }
        }
    }

    return union;
};

/**
 * Parse the AppConfig to generate the AppSettings for the app
 * @param config
 * @returns
 */
const parseAppConfig = (config: AppConfig): AppSettings => {
    const routes: Route[] = [];
    const queryMap: { [queryType: string]: any } = {};
    const mutationMap: { [mutationType: string]: any } = {};
    const navigationTemplate: RestrictedSideNavigationItem[] = [];
    const standaloneModules = config.modules.filter((m) => m.canRunAsStandaloneMode);
    const isStandaloneMode = (standaloneModules.length || 0) === 1;
    let appCustomSettings = defaultAppCustomSettings;
    const navTemplateProcessors: ComponentType<
        ProcessorProps<RestrictedSideNavigationItem[]>
    >[] = [];

    if (isStandaloneMode) {
        // Standalone mode
        const module = standaloneModules[0] as StandaloneAppModuleConfig;

        appCustomSettings = {
            ...appCustomSettings,
            ...module.customSettingsOverride,
            ...config.customSettingsOverride,
        };

        if (appCustomSettings.renderNavigationPanel && module.navigationTemplate) {
            if (
                module.navigationTemplate.length === 1 &&
                (module.navigationTemplate[0].items?.length || 0) >= 1
            ) {
                navigationTemplate.push(...(module.navigationTemplate[0].items || []));
            } else {
                navigationTemplate.push(...module.navigationTemplate);
            }
        }
    } else {
        // Multiple app modules
        appCustomSettings = {
            ...appCustomSettings,
            ...config.customSettingsOverride,
        };

        // Merge navigation template
        navigationTemplate.push(
            ...config.modules.reduce(
                (sum: RestrictedSideNavigationItem[], mod: AppModuleConfig) => {
                    const result = [...sum];
                    if (mod.navigationTemplate) {
                        mod.navigationTemplate.forEach((item) => {
                            if (item.type === SideNavigationItemType.SECTION) {
                                // search for the existing section
                                const sectionHeader = result.find(
                                    (entry) =>
                                        entry.type === SideNavigationItemType.SECTION &&
                                        entry.text === item.text
                                );
                                // if we found the section existing
                                if (sectionHeader) {
                                    if (sectionHeader.items) {
                                        sectionHeader.items?.push(...(item.items || []));
                                    } else {
                                        sectionHeader.items = [...(item.items || [])];
                                    }
                                } else {
                                    //we will add the section
                                    result.push({
                                        ...item,
                                        items: [...(item.items || [])],
                                    });
                                }
                            } else {
                                // if it is not a section, just added the entry
                                result.push({ ...item, items: [...(item.items || [])] });
                            }
                        });
                    }
                    return result;
                },
                []
            )
        );
    }

    // routes
    // Unauthenticated GetStarted page route
    if (appCustomSettings.HomeComponent) {
        routes.push({
            path: ROUTE_GET_STARTED,
            Component: appCustomSettings.HomeComponent,
            exact: true,
            secure: false,
        });
    }

    // Authenticated Dashboard page route
    if (appCustomSettings.DashboardComponent) {
        routes.push({
            path: ROUTE_DASHBOARD,
            Component: appCustomSettings.DashboardComponent,
            exact: true,
            secure: true,
        });
    }

    config.modules.forEach((module) => {
        if (module.routes) {
            routes.push(...module.routes);
        }

        if (module.queryMap) {
            Object.keys(module.queryMap).forEach((qk) => {
                queryMap[qk] = module.queryMap![qk];
            });
        }

        if (module.mutationMap) {
            Object.keys(module.mutationMap).forEach((mk) => {
                mutationMap[mk] = module.mutationMap![mk];
            });
        }

        if (module.navTemplateProcessor) {
            navTemplateProcessors.push(module.navTemplateProcessor);
        }
    });

    if (config.navTemplateProcessor) {
        navTemplateProcessors.push(config.navTemplateProcessor);
    }

    return {
        routes: arrayUnion(
            config.routesOverride || [],
            routes,
            (item: Route) => item.path
        ),
        queryMap: { ...queryMap, ...config.queryMapOverride },
        mutationMap: { ...mutationMap, ...config.mutationMapOverride },
        navigationTemplate:
            config.navigationTemplateOverrideFunc?.(navigationTemplate) ||
            navigationTemplate,
        renderNavigationPanel: appCustomSettings.renderNavigationPanel!,
        appHeader: appCustomSettings.appHeader!,
        navHeader: appCustomSettings.navHeader!,
        htmlPageTitle: appCustomSettings.htmlPageTitle!,
        navTemplateProcessors,
    };
};

export default parseAppConfig;
