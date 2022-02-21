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
import React, { ComponentType } from 'react';
import { UserGroup } from './userGroup';
import { MutationMap, QueryMap } from '../queries';
import { SideNavigationItem } from 'aws-northstar/components/SideNavigation';
import { ProcessorProps } from '../components/ProcessorList';

/**
 * The app level configuration
 */
export interface AppConfig {
    /**
     * The modules that constitute the app.
     * If only one module is provided, then the app is running as Standalone mode.
     */
    modules: AppModuleConfig[];
    /**
     * Specifies the custom setting.
     * The App Level customSettingsOverride takes precedence over Standalone
     * App Module customSettingsOverride.
     */
    customSettingsOverride?: AppCustomSettings;
    /**
     * Override the existing routes.
     */
    routesOverride?: Route[];
    /**
     * Override the existing queryMap;
     */
    queryMapOverride?: QueryMap;
    /**
     * Override the existing queryMap;
     */
    mutationMapOverride?: MutationMap;
    /**
     * Override the existing navigation Templates.
     */
    navigationTemplateOverrideFunc?: (
        currentNavItems: RestrictedSideNavigationItem[]
    ) => RestrictedSideNavigationItem[];
    /**
     * Inject NavTemplate Processor.
     */
    navTemplateProcessor?: ComponentType<ProcessorProps<RestrictedSideNavigationItem[]>>;
}

/**
 * The app module level configuraiton.
 */
export type AppModuleConfig = StandaloneAppModuleConfig | FunctionalAppModuleConfig;

/**
 * Shared app module level configuration.
 */
export interface AppModuleConfigBase {
    /** The name of the app module */
    name: string;
    /**
     * Specifies the query map supported in this module.
     * All the queryMap from plugined modules will be merged.
     */
    queryMap?: QueryMap;
    /**
     * Specifies the mutation map supported in this module.
     * All the mutationMap from plugined modules will be merged.
     */
    mutationMap?: MutationMap;
    /**
     * Specifies the routes supported in the module.
     * All the routes from plugined modules will be merged.
     *
     */
    routes?: Route[];
    /**
     * Specifies the navigationTemplate for rendering the navigation panel.
     * All the navigationTemplate from plugined modules will be merged in the order based on position in the modules list.
     * In the Standalone mode,
     * If there is only one root node, only children nodes of that root node will be rendered.
     * If there are multiple root nodes, all the roots will be rendered as they are.
     */
    navigationTemplate?: RestrictedSideNavigationItem[];
    /**
     * Inject NavTemplate Processor.
     */
    navTemplateProcessor?: ComponentType<ProcessorProps<RestrictedSideNavigationItem[]>>;
}

/**
 * Functional App Module configration for the app module that are not designed to run as standalone mode.
 */
export interface FunctionalAppModuleConfig extends AppModuleConfigBase {
    /**
     * The app module cannot be run as standalone mode. It is imported and used by other modules.
     */
    canRunAsStandaloneMode: false;
}

/**
 * Standalone App Module configuration for the app module that can be run as standalone mode.
 */
export interface StandaloneAppModuleConfig extends AppModuleConfigBase {
    /**
     * The app module can be run as standalone mode.
     */
    canRunAsStandaloneMode: true;
    /**
     * Specifies the custom setting.
     * The App Level customSettingsOverride takes precedence over Standalone
     * App Module customSettingsOverride.
     */
    customSettingsOverride?: AppCustomSettings;
}

/**
 * Custom app settings.
 */
export interface AppCustomSettings {
    /**
     * Specified the App Header.
     */
    appHeader?: string;
    /**
     * Specified the Navigation Panel Header.
     */
    navHeader?: string;
    /**
     * Specified the HtmlPageTitle.
     */
    htmlPageTitle?: string;
    /**
     * Specifies the component to be rendered as Dashboard page.
     * If not provided, the default AGS Dashboard page will be rendered.
     */
    DashboardComponent?: ComponentType;
    /**
     * Specifies the component to be rendered as Home (Get Started) page.
     * If not provided, the default AGS GetStarted page is used.
     */
    HomeComponent?: ComponentType;
    /**
     * Specifies whether to render the navigation panel.
     * If not provided, the app will render navigation panel.
     */
    renderNavigationPanel?: boolean;
}

/**
 * The app settings applied to the App. This settings are generated by the app config parser.
 */
export interface AppSettings {
    appHeader: string;
    navHeader: string;
    htmlPageTitle: string;
    routes: Route[];
    queryMap: QueryMap;
    mutationMap: MutationMap;
    renderNavigationPanel: boolean;
    navigationTemplate?: RestrictedSideNavigationItem[];
    navTemplateProcessors: ComponentType<
        ProcessorProps<RestrictedSideNavigationItem[]>
    >[];
}

/**
 * Service endpoints.
 */
export interface ApiEndpoints {
    [serviceName: string]: string;
}

/**
 * User credential.
 */
export interface UserCredential {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
}

/**
 * The Navigation Items for the Navigation Panel.
 */
export interface RestrictedSideNavigationItem extends SideNavigationItem {
    restrictedGroups?: UserGroup[];
    requiredServices?: string[];
    hideIfNoItem?: boolean;
    items?: RestrictedSideNavigationItem[];
}

/**
 * The Route for the app.
 */
export interface Route {
    /**The path of the page */
    path: string;
    /** The page component to be rendered */
    Component: React.ComponentType;
    /** When true, will only match if the path matches the location.pathname exactly.*/
    exact: boolean;
    /** Whether the page is behind the authentication. Default: true.*/
    secure?: boolean;
    /** Restricted the visit to certain user groups */
    restrictedGroups?: UserGroup[];
}
