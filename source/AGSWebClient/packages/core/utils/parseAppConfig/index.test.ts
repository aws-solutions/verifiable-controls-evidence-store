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
import { ComponentType } from 'react';
import { AppConfig, AppModuleConfig } from '@ags/webclient-core/types';
import { SideNavigationItemType } from 'aws-northstar/components/SideNavigation';
import { RestrictedSideNavigationItem } from '../../types';
import { ProcessorProps } from '../../components/ProcessorList';
import parseAppConfig from './index';

const appModuleAConfig: AppModuleConfig = {
    name: 'TestModuleA',
    queryMap: {
        Query1A: {},
        Query2A: {},
    },
    mutationMap: {
        Mutation1A: {},
        Mutation2A: {},
    },
    navigationTemplate: [
        {
            type: SideNavigationItemType.SECTION,
            text: 'Test Folder',
            hideIfNoItem: true,
            items: [
                {
                    type: SideNavigationItemType.LINK,
                    text: 'Test Item A1',
                },
            ],
        },
        {
            type: SideNavigationItemType.LINK,
            text: 'Test Item A2',
        },
        {
            type: SideNavigationItemType.SECTION,
            text: 'Blank Header',
        },
    ],
    navTemplateProcessor: {} as ComponentType<
        ProcessorProps<RestrictedSideNavigationItem[]>
    >,
    canRunAsStandaloneMode: false,
    routes: [
        {
            path: '/1',
            Component: {} as ComponentType<{}>,
            exact: true,
        },
        {
            path: '/2',
            Component: {} as ComponentType<{}>,
            exact: true,
        },
    ],
};

const appModuleBConfig: AppModuleConfig = {
    name: 'TestModuleB',
    queryMap: {
        Query1B: {},
        Query2B: {},
    },
    mutationMap: {
        Mutation1B: {},
        Mutation2B: {},
    },
    navigationTemplate: [
        {
            type: SideNavigationItemType.SECTION,
            text: 'Test Folder',
            hideIfNoItem: true,
            items: [
                {
                    type: SideNavigationItemType.LINK,
                    text: 'Test Item B1',
                },
            ],
        },
        {
            type: SideNavigationItemType.LINK,
            text: 'Test Item B2',
        },
    ],
    canRunAsStandaloneMode: false,
    routes: [
        {
            path: '/3',
            Component: {} as ComponentType<{}>,
            exact: true,
        },
        {
            path: '/4',
            Component: {} as ComponentType<{}>,
            exact: true,
        },
    ],
};

describe('parse app config', () => {
    test('multiple modules', () => {
        const appConfig: AppConfig = {
            modules: [appModuleAConfig, appModuleBConfig],
            navTemplateProcessor: {} as ComponentType<
                ProcessorProps<RestrictedSideNavigationItem[]>
            >,
            routesOverride: [
                {
                    path: '/3',
                    Component: {} as ComponentType<{}>,
                    exact: true,
                },
            ],
            customSettingsOverride: {
                renderNavigationPanel: true,
                appHeader: 'Test Modules',
                navHeader: 'Test Modules',
                htmlPageTitle: 'Test Modules',
            },
        };
        expect(parseAppConfig(appConfig)).toMatchObject({
            appHeader: 'Test Modules',
            htmlPageTitle: 'Test Modules',
            navHeader: 'Test Modules',
            mutationMap: {
                Mutation1A: {},
                Mutation1B: {},
                Mutation2A: {},
                Mutation2B: {},
            },
            queryMap: {
                Query1A: {},
                Query1B: {},
                Query2A: {},
                Query2B: {},
            },
            navigationTemplate: [
                {
                    text: 'Test Folder',
                    type: 'section',
                    hideIfNoItem: true,
                    items: [
                        {
                            text: 'Test Item A1',
                            type: 'link',
                        },
                        {
                            text: 'Test Item B1',
                            type: 'link',
                        },
                    ],
                },
                {
                    items: [],
                    text: 'Test Item A2',
                    type: 'link',
                },
                {
                    items: [],
                    text: 'Blank Header',
                    type: 'section',
                },
                {
                    items: [],
                    text: 'Test Item B2',
                    type: 'link',
                },
            ],
            renderNavigationPanel: true,
            routes: [
                {
                    Component: {},
                    path: '/3',
                },
                {
                    Component: expect.any(Object),
                    exact: true,
                    path: '/getStarted',
                    secure: false,
                },
                {
                    Component: expect.anything(),
                    exact: true,
                    path: '/',
                    secure: true,
                },
                {
                    Component: {},
                    path: '/1',
                },
                {
                    Component: {},
                    path: '/2',
                },
                {
                    Component: {},
                    path: '/4',
                },
            ],
        });
    });

    test('standalone modules', () => {
        const appConfig: AppConfig = {
            modules: [
                { ...appModuleAConfig, canRunAsStandaloneMode: true },
                appModuleBConfig,
            ],
            customSettingsOverride: {
                renderNavigationPanel: true,
                appHeader: 'Test Modules',
                navHeader: 'Test Modules',
                htmlPageTitle: 'Test Modules',
            },
        };
        expect(parseAppConfig(appConfig)).toMatchObject({
            appHeader: 'Test Modules',
            htmlPageTitle: 'Test Modules',
            navHeader: 'Test Modules',
            mutationMap: {
                Mutation1A: {},
                Mutation1B: {},
                Mutation2A: {},
                Mutation2B: {},
            },
            queryMap: {
                Query1A: {},
                Query1B: {},
                Query2A: {},
                Query2B: {},
            },
            navigationTemplate: [
                {
                    text: 'Test Folder',
                    type: 'section',
                    hideIfNoItem: true,
                    items: [
                        {
                            text: 'Test Item A1',
                            type: 'link',
                        },
                    ],
                },
                {
                    text: 'Test Item A2',
                    type: 'link',
                },
                {
                    text: 'Blank Header',
                    type: 'section',
                },
            ],
            renderNavigationPanel: true,
            routes: [
                {
                    Component: expect.anything(),
                    exact: true,
                    path: '/getStarted',
                    secure: false,
                },
                {
                    Component: expect.anything(),
                    exact: true,
                    path: '/',
                    secure: true,
                },
                {
                    Component: expect.anything(),
                    path: '/1',
                },
                {
                    Component: {},
                    path: '/2',
                },
                {
                    Component: {},
                    path: '/3',
                },
                {
                    Component: {},
                    path: '/4',
                },
            ],
        });
    });
});
