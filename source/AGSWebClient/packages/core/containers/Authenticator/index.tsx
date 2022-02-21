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
import { FunctionComponent, useEffect, useMemo, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import PageLoading from '../../components/PageLoading';
import PermissionDenied from '../../components/PermissionDenied';
import { useGovSuiteAppApi } from '../../containers/AppContext';
import { login, getUserCredentials } from '../../utils/auth';
import { ROUTE_GET_STARTED } from '../../config/routes';
import { UserGroup } from '../../types';
import fetchApiEndpoints from '../../utils/fetchApiEndpoints';

export interface AuthenticatorProps {
    restrictedGroups?: UserGroup[];
}

const Authenticator: FunctionComponent<AuthenticatorProps> = ({
    restrictedGroups,
    children,
}) => {
    const {
        hasLoggedIn,
        setApiEndpoints,
        setHasLoggedIn,
        setUserCredential,
        setUserDisplayName,
        setUserGroups,
        userGroups,
        auth,
    } = useGovSuiteAppApi();
    const history = useHistory();

    // fetch API endpoints from backend
    const getApiEndpoints = useCallback(async (credentials) => {
        try {
            console.log('Retrieving Api endpoints.');
            const endpoints = await fetchApiEndpoints(credentials);
            console.log('Api endpoints received.');
            console.debug(endpoints);
            return endpoints;
        } catch (e: any) {
            console.log('Retrieving Api endpoints failed.');
            // check if the security token is expired, if yes, clear and re-authenticate
            if (
                e.name === 'ExpiredTokenException' &&
                e.message === 'The security token included in the request is expired'
            ) {
                console.log(
                    'Credentials expried on retrieving Api Endpoints. Redirect to authentication.'
                );
            } else {
                console.log(
                    `Failed to retrieve Api endpoints. Error: ${JSON.stringify(e)}`
                );
                console.error(e);
            }

            // failed to retrieve Api Endpoints, cleared cached
            return undefined;
        }
    }, []);

    const authenticate = useCallback(
        async (hasUserLoggedIn?: boolean) => {
            if (!hasUserLoggedIn) {
                try {
                    console.log('Authenticating.');
                    await login(auth);
                    console.log('Checking user credentials in local storage.');
                    const userCredentials = getUserCredentials();

                    if (userCredentials) {
                        console.log('User credentials found. Login successfully.');
                        console.debug(userCredentials);

                        setUserGroups(userCredentials.userGroups);
                        setUserDisplayName(userCredentials.displayName);
                        setUserCredential(userCredentials);
                        const apiEndpoints = await getApiEndpoints(userCredentials);
                        if (apiEndpoints) {
                            setApiEndpoints(apiEndpoints);
                            setHasLoggedIn(true);
                            return;
                        } else {
                            console.log(
                                'API Endpoints not found, redirect to getStarted page.'
                            );
                        }
                    } else {
                        console.log(
                            'User credentials not found, redirect to getStarted page.'
                        );
                    }

                    setHasLoggedIn(false);
                    history.push(ROUTE_GET_STARTED);
                } catch (e) {
                    console.log('Error in authenticating', e);
                    setHasLoggedIn(false);
                    history.push(ROUTE_GET_STARTED);
                }
            }
        },
        [
            getApiEndpoints,
            history,
            setApiEndpoints,
            setHasLoggedIn,
            setUserCredential,
            setUserDisplayName,
            setUserGroups,
            auth,
        ]
    );

    useEffect(() => {
        authenticate(hasLoggedIn);
    }, [authenticate, hasLoggedIn]);

    const denyAccess = useMemo(() => {
        return (
            restrictedGroups &&
            !userGroups.some(
                (userGroup) =>
                    userGroup === UserGroup.SystemAdmin ||
                    restrictedGroups?.includes(userGroup)
            )
        );
    }, [restrictedGroups, userGroups]);

    if (hasLoggedIn) {
        return denyAccess ? <PermissionDenied /> : <>{children}</>;
    }

    return <PageLoading />;
};

export default Authenticator;
