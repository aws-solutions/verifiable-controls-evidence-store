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
import {
    FunctionComponent,
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
} from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { clearSecurityToken } from '../../utils/auth';
import { UserGroup, UserCredential, ApiEndpoints, AuthSettings } from '../../types';
import { getQueryClientParameters } from '../../queries';

export const maxNotifications = 5;

export interface GovSuiteAppApi {
    inProgress: boolean;
    setInProgress: (inProgress: boolean) => void;
    hasLoggedIn: boolean;
    setHasLoggedIn: (hasLoggedIn: boolean) => void;
    userGroups: UserGroup[];
    setUserGroups: (userGroups: UserGroup[]) => void;
    userDisplayName: string;
    setUserDisplayName: (displayName: string) => void;
    userCredential?: UserCredential;
    setUserCredential: (userCredential: UserCredential) => void;
    apiEndpoints?: ApiEndpoints;
    setApiEndpoints: (apiEndpoints?: ApiEndpoints) => void;
    enterpriseName: string;
    setEnterpriseName: (enterpriseName: string) => void;
    isFeatureOn: (featureName: string) => boolean;
    featureToggles: string;
    setFeatureToggles: (featureToggles: string) => void;
    mutationMap: { [mutationType: string]: any };
    auth: AuthSettings;
}

export const initialState = {
    inProgress: false,
    setInProgress: () => {},
    hasLoggedIn: false,
    setHasLoggedIn: () => {},
    userGroups: [],
    setUserGroups: () => {},
    userDisplayName: '',
    setUserDisplayName: () => {},
    setUserCredential: () => {},
    setApiEndpoints: () => {},
    enterpriseName: '',
    setEnterpriseName: () => {},
    isFeatureOn: () => false,
    featureToggles: '',
    setFeatureToggles: () => {},
    mutationMap: {},
    auth: { signInLink: '' },
};

export const AppContext = createContext<GovSuiteAppApi>(initialState);

export interface AppContextProps {
    queryMap: { [queryType: string]: any };
    mutationMap: { [mutationType: string]: any };
    auth: any;
}

const AppContextProvider: FunctionComponent<AppContextProps> = ({
    children,
    queryMap,
    mutationMap,
    auth,
}) => {
    const [inProgress, setInProgress] = useState(false);
    const [hasLoggedIn, setHasLoggedIn] = useState(false);
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    const [userDisplayName, setUserDisplayName] = useState('User');
    const [userCredential, setUserCredential] = useState<UserCredential>();
    const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoints>();
    const [enterpriseName, setEnterpriseName] = useState('');
    const [featureToggles, setFeatureToggles] = useState('');

    const setReauthenticate = useCallback(() => {
        console.log('Credentials expried. Redirect to authentication.');
        clearSecurityToken();
        setHasLoggedIn(false);
    }, []);

    const isFeatureOn = useCallback(
        (featureName: string) => {
            return featureToggles?.split('|').includes(featureName) || false;
        },
        [featureToggles]
    );

    // setup QueryClient to talk to the backend
    const queryClient = useMemo(
        () =>
            new QueryClient(
                getQueryClientParameters(
                    queryMap,
                    userCredential,
                    apiEndpoints,
                    setReauthenticate
                )
            ),
        [queryMap, userCredential, apiEndpoints, setReauthenticate]
    );

    return (
        <AppContext.Provider
            value={{
                ...initialState,
                inProgress,
                setInProgress,
                hasLoggedIn,
                setHasLoggedIn,
                userGroups,
                setUserGroups,
                userDisplayName,
                setUserDisplayName,
                userCredential,
                setUserCredential,
                apiEndpoints,
                setApiEndpoints,
                enterpriseName,
                setEnterpriseName,
                isFeatureOn,
                featureToggles,
                setFeatureToggles,
                mutationMap,
                auth,
            }}
        >
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AppContext.Provider>
    );
};

export const useGovSuiteAppApi = () => useContext(AppContext);

export default AppContextProvider;
