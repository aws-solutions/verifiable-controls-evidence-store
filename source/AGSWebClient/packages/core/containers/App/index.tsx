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
import { FunctionComponent, useMemo, Suspense } from 'react';
import NorthStarThemeProvider from 'aws-northstar/components/NorthStarThemeProvider';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import AppContext from '../AppContext';
import HelmetSettings from '../HelmetSettings';
import PageLoading from '../../components/PageLoading';
import AppLayout from '../../layouts/AppLayout';
import withEnhancers from '../../enhancers/withEnhancers';
import { AppConfig, AuthSettings } from '../../types';
import parseAppConfig from '../../utils/parseAppConfig';
import { ROUTE_DASHBOARD } from '../../config/routes';

export interface AppProps extends AppConfig {
    auth: AuthSettings;
}

const App: FunctionComponent<AppProps> = ({ auth, ...appConfig }) => {
    const config = useMemo(() => parseAppConfig(appConfig), [appConfig]);
    console.log(config);
    return (
        <NorthStarThemeProvider>
            <AppContext
                queryMap={config.queryMap}
                mutationMap={config.mutationMap}
                auth={auth}
            >
                <HelmetSettings pageHtmlTitle={config.htmlPageTitle} />
                <Suspense fallback={<PageLoading />}>
                    <Router>
                        <AppLayout
                            availableRoutes={config.routes}
                            navigationTemplate={config.navigationTemplate || []}
                            renderNavigationPanel={config.renderNavigationPanel}
                            navTemplateProcessors={config.navTemplateProcessors}
                            appHeader={config.appHeader}
                            navHeader={config.navHeader}
                        >
                            <Switch>
                                {config.routes.map((route) => (
                                    <Route
                                        key={route.path}
                                        exact={true}
                                        path={route.path}
                                        component={
                                            route.secure === false
                                                ? route.Component
                                                : withEnhancers(route)
                                        }
                                    />
                                ))}
                                <Redirect to={ROUTE_DASHBOARD} />
                            </Switch>
                        </AppLayout>
                    </Router>
                </Suspense>
            </AppContext>
        </NorthStarThemeProvider>
    );
};

export default App;
