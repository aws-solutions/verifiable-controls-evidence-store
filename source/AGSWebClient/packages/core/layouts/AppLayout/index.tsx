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
import { useCallback, useMemo, FunctionComponent, ComponentType } from 'react';
import Inline from 'aws-northstar/layouts/Inline';
import AppLayoutBase from 'aws-northstar/layouts/AppLayout';
import HeaderBase from 'aws-northstar/components/Header';
import BreadcrumbGroup from 'aws-northstar/components/BreadcrumbGroup';
import ButtonDropdown from 'aws-northstar/components/ButtonDropdown';
import Box from 'aws-northstar/layouts/Box';

import { Route, RestrictedSideNavigationItem } from '../../types';
import { useGovSuiteAppApi, maxNotifications } from '../../containers/AppContext';
import SideNavigationPanel from '../../containers/SideNavigationPanel';
import { logout } from '../../utils/auth';
import ProcessorList, { ProcessorProps } from '../../components/ProcessorList';
import { getAppHeader, getNavHeader } from '../../utils/appUtils';

export interface AppLayoutProps {
    availableRoutes?: Route[];
    navigationTemplate: RestrictedSideNavigationItem[];
    navTemplateProcessors: ComponentType<
        ProcessorProps<RestrictedSideNavigationItem[]>
    >[];
    renderNavigationPanel: boolean;
    appHeader: string;
    navHeader: string;
}

const AppLayout: FunctionComponent<AppLayoutProps> = ({
    children,
    availableRoutes,
    navigationTemplate,
    renderNavigationPanel,
    navTemplateProcessors,
    appHeader,
    navHeader,
}) => {
    const { inProgress, userDisplayName, setHasLoggedIn, hasLoggedIn, apiEndpoints } =
        useGovSuiteAppApi();

    const handleSignOut = useCallback(() => {
        console.log('User sign out');
        logout();
        setHasLoggedIn(false);
    }, [setHasLoggedIn]);

    const [appHeaderText, navHeaderText] = useMemo(() => {
        return [getAppHeader(apiEndpoints ?? {}), getNavHeader(apiEndpoints ?? {})];
    }, [apiEndpoints]);

    const Header = useMemo(() => {
        const headerDropdown = (
            <ButtonDropdown
                content={userDisplayName}
                items={[{ text: 'Sign Out', onClick: handleSignOut }]}
                disableArrowDropdown
                darkTheme
            />
        );

        const headerContent = (
            <Box>
                <Inline>{headerDropdown}</Inline>
            </Box>
        );

        return (
            <HeaderBase
                title={appHeader ?? appHeaderText}
                rightContent={hasLoggedIn && headerContent}
            />
        );
    }, [hasLoggedIn, userDisplayName, handleSignOut, appHeader, appHeaderText]);

    const Breadcrumbs = useMemo(
        () => <BreadcrumbGroup rootPath="Home" availableRoutes={availableRoutes} />,
        [availableRoutes]
    );

    const Navigation = useMemo(
        () =>
            (renderNavigationPanel && hasLoggedIn && (
                <ProcessorList
                    Processors={navTemplateProcessors}
                    settings={navigationTemplate}
                >
                    {(newNavTemplate) => (
                        <SideNavigationPanel
                            header={navHeader ?? navHeaderText}
                            navigationTemplate={newNavTemplate}
                        />
                    )}
                </ProcessorList>
            )) ||
            undefined,
        [
            hasLoggedIn,
            renderNavigationPanel,
            navTemplateProcessors,
            navigationTemplate,
            navHeader,
            navHeaderText,
        ]
    );

    return (
        <AppLayoutBase
            header={Header}
            breadcrumbs={hasLoggedIn && Breadcrumbs}
            paddingContentArea={true}
            maxNotifications={maxNotifications}
            inProgress={inProgress}
            navigation={Navigation}
        >
            {children}
        </AppLayoutBase>
    );
};

export default AppLayout;
