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

import { MemoryRouter } from 'react-router-dom';
import { render, cleanup, waitFor } from '@testing-library/react';
import { AppContext, initialState } from '../AppContext';
import { UserGroup } from '../../types';
import fetchApiEndpoints from '../../utils/fetchApiEndpoints';
import * as auth from '../../utils/auth';
import Authenticator from '.';

jest.mock('../../utils/auth');
jest.mock('../../utils/fetchApiEndpoints', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const userCredentials = {
    userGroups: [UserGroup.ApplicationDeveloper, UserGroup.ApplicationOwner],
    displayName: 'Test User',
};

const apiEndpoints = {
    endpoint1: 'endpoint1',
    endpoint2: 'endpoint2',
};

describe('Authenticator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cleanup();
    });

    describe('when hasLoggedIn is true', () => {
        test('returns MainComponent when there is not restrictedGroups present', () => {
            const { getByText } = render(
                <AppContext.Provider
                    value={{
                        ...initialState,
                        hasLoggedIn: true,
                    }}
                >
                    <Authenticator>Main Component</Authenticator>
                </AppContext.Provider>
            );

            expect(getByText('Main Component')).toBeVisible();
            expect(auth.login).not.toHaveBeenCalled();
            expect(auth.getUserCredentials).not.toHaveBeenCalled();
            expect(fetchApiEndpoints).not.toHaveBeenCalled();
        });

        test('returns MainComponent when there is restrictedGroups present and userGroups are within the restrictedGroups group', () => {
            const { getByText } = render(
                <AppContext.Provider
                    value={{
                        ...initialState,
                        hasLoggedIn: true,
                        userGroups: [UserGroup.ApplicationDeveloper],
                    }}
                >
                    <Authenticator
                        restrictedGroups={[
                            UserGroup.ApplicationDeveloper,
                            UserGroup.ApplicationOwner,
                        ]}
                    >
                        Main Component
                    </Authenticator>
                </AppContext.Provider>
            );

            expect(getByText('Main Component')).toBeVisible();
        });

        test('returns PermissionDenied when there is restrictedGroups present and userGroups are not within the restrictedGroups group', () => {
            const { getByText, queryByText } = render(
                <AppContext.Provider
                    value={{
                        ...initialState,
                        hasLoggedIn: true,
                        userGroups: [UserGroup.Line1Risk, UserGroup.Line2Risk],
                    }}
                >
                    <Authenticator
                        restrictedGroups={[
                            UserGroup.ApplicationDeveloper,
                            UserGroup.ApplicationOwner,
                        ]}
                    >
                        Main Component
                    </Authenticator>
                </AppContext.Provider>
            );

            expect(queryByText('Main Component')).toBeNull();
            expect(
                getByText('You do not have permission to access this page')
            ).toBeVisible();
        });
    });

    describe('when hasLoggedIn is false', () => {
        test('set all the value when authentication succeed', async () => {
            (auth.login as jest.Mock).mockResolvedValue('success');
            (auth.getUserCredentials as jest.Mock).mockReturnValue(userCredentials);
            (fetchApiEndpoints as jest.Mock).mockResolvedValue(apiEndpoints);

            const mockSetHasLoggedIn = jest.fn();
            const mockSetUserCredential = jest.fn();
            const mockSetApiEndpoints = jest.fn();
            const mockSetUserDisplayName = jest.fn();
            const mockSetUserGroups = jest.fn();

            const { getByRole } = render(
                <AppContext.Provider
                    value={{
                        ...initialState,
                        setHasLoggedIn: mockSetHasLoggedIn,
                        setUserCredential: mockSetUserCredential,
                        setApiEndpoints: mockSetApiEndpoints,
                        setUserDisplayName: mockSetUserDisplayName,
                        setUserGroups: mockSetUserGroups,
                    }}
                >
                    <MemoryRouter>
                        <Authenticator>Main Component</Authenticator>
                    </MemoryRouter>
                </AppContext.Provider>
            );

            expect(getByRole('progressbar')).toBeVisible();

            await waitFor(() => {
                expect(mockSetHasLoggedIn).toHaveBeenCalledWith(true);
                expect(auth.login).toHaveBeenCalledTimes(1);
                expect(auth.getUserCredentials).toHaveBeenCalledTimes(1);
                expect(mockSetUserGroups).toHaveBeenCalledWith(
                    userCredentials.userGroups
                );
                expect(mockSetUserDisplayName).toHaveBeenCalledWith(
                    userCredentials.displayName
                );
                expect(mockSetUserCredential).toHaveBeenCalledWith(userCredentials);
                expect(mockSetApiEndpoints).toHaveBeenCalledWith(apiEndpoints);
            });
        });

        test('sets hasLoggedIn false when login process failed', async () => {
            (auth.login as jest.Mock).mockRejectedValue('failed');
            (auth.getUserCredentials as jest.Mock).mockReturnValue(userCredentials);
            (fetchApiEndpoints as jest.Mock).mockResolvedValue(apiEndpoints);

            const mockSetHasLoggedIn = jest.fn();
            const mockSetUserCredential = jest.fn();
            const mockSetApiEndpoints = jest.fn();
            const mockSetUserDisplayName = jest.fn();
            const mockSetUserGroups = jest.fn();

            render(
                <AppContext.Provider
                    value={{
                        ...initialState,
                        setHasLoggedIn: mockSetHasLoggedIn,
                        setUserCredential: mockSetUserCredential,
                        setApiEndpoints: mockSetApiEndpoints,
                        setUserDisplayName: mockSetUserDisplayName,
                        setUserGroups: mockSetUserGroups,
                    }}
                >
                    <MemoryRouter>
                        <Authenticator>Main Component</Authenticator>
                    </MemoryRouter>
                </AppContext.Provider>
            );

            await waitFor(() => {
                expect(mockSetHasLoggedIn).toHaveBeenCalledWith(false);
                expect(auth.login).toHaveBeenCalledTimes(1);
                expect(auth.getUserCredentials).not.toHaveBeenCalled();
                expect(mockSetUserGroups).not.toHaveBeenCalled();
                expect(mockSetUserDisplayName).not.toHaveBeenCalled();
                expect(mockSetUserCredential).not.toHaveBeenCalled();
                expect(mockSetApiEndpoints).not.toHaveBeenCalled();
            });
        });

        test('sets hasLoggedIn false when user credential is empty', async () => {
            (auth.login as jest.Mock).mockResolvedValue('success');
            (auth.getUserCredentials as jest.Mock).mockReturnValue(undefined);
            (fetchApiEndpoints as jest.Mock).mockResolvedValue(apiEndpoints);

            const mockSetHasLoggedIn = jest.fn();
            const mockSetUserCredential = jest.fn();
            const mockSetApiEndpoints = jest.fn();
            const mockSetUserDisplayName = jest.fn();
            const mockSetUserGroups = jest.fn();

            render(
                <AppContext.Provider
                    value={{
                        ...initialState,
                        setHasLoggedIn: mockSetHasLoggedIn,
                        setUserCredential: mockSetUserCredential,
                        setApiEndpoints: mockSetApiEndpoints,
                        setUserDisplayName: mockSetUserDisplayName,
                        setUserGroups: mockSetUserGroups,
                    }}
                >
                    <MemoryRouter>
                        <Authenticator>Main Component</Authenticator>
                    </MemoryRouter>
                </AppContext.Provider>
            );

            await waitFor(() => {
                expect(mockSetHasLoggedIn).toHaveBeenCalledWith(false);
                expect(auth.login).toHaveBeenCalledTimes(1);
                expect(auth.getUserCredentials).toHaveBeenCalledTimes(1);
                expect(mockSetUserGroups).not.toHaveBeenCalled();
                expect(mockSetUserDisplayName).not.toHaveBeenCalled();
                expect(mockSetUserCredential).not.toHaveBeenCalled();
                expect(mockSetApiEndpoints).not.toHaveBeenCalled();
            });
        });

        test('sets hasLoggedIn false if unable to fetch api endpoints', async () => {
            (auth.login as jest.Mock).mockResolvedValue('success');
            (auth.getUserCredentials as jest.Mock).mockReturnValue(userCredentials);
            (fetchApiEndpoints as jest.Mock).mockRejectedValue('failed');

            const mockSetHasLoggedIn = jest.fn();
            const mockSetUserCredential = jest.fn();
            const mockSetApiEndpoints = jest.fn();
            const mockSetUserDisplayName = jest.fn();
            const mockSetUserGroups = jest.fn();

            render(
                <AppContext.Provider
                    value={{
                        ...initialState,
                        setHasLoggedIn: mockSetHasLoggedIn,
                        setUserCredential: mockSetUserCredential,
                        setApiEndpoints: mockSetApiEndpoints,
                        setUserDisplayName: mockSetUserDisplayName,
                        setUserGroups: mockSetUserGroups,
                    }}
                >
                    <MemoryRouter>
                        <Authenticator>Main Component</Authenticator>
                    </MemoryRouter>
                </AppContext.Provider>
            );

            await waitFor(() => {
                expect(mockSetHasLoggedIn).toHaveBeenCalledWith(false);
                expect(auth.login).toHaveBeenCalledTimes(1);
                expect(auth.getUserCredentials).toHaveBeenCalledTimes(1);
                expect(mockSetUserGroups).toHaveBeenCalledWith(
                    userCredentials.userGroups
                );
                expect(mockSetUserDisplayName).toHaveBeenCalledWith(
                    userCredentials.displayName
                );
                expect(mockSetUserCredential).toHaveBeenCalledWith(userCredentials);
                expect(mockSetApiEndpoints).not.toHaveBeenCalled();
            });
        });
    });
});
