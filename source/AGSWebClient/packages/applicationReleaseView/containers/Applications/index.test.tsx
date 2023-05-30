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
import * as appContext from '@ags/webclient-core/containers/AppContext';

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';

import { ApplicationSummary } from '@ags/webclient-application-release-core/types';
import ApplicationsContainer from '.';
import { BrowserRouter } from 'react-router-dom';
import { UserGroup } from '@ags/webclient-core/types';

// Mocks
const mockMutateFn = jest.fn();
const mockAddNotificationFn = jest.fn();

jest.mock('@ags/webclient-core/containers/AppContext');
jest.mock('@ags/webclient-core/queries');
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({
        addNotification: mockAddNotificationFn,
    }),
}));

const mockedUseAgsListQuery = useAgsListQuery as jest.Mock<any>;
const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;

const fixtureListApplicationsData: ApplicationSummary[] = [
    {
        name: 'App1638118900061',
        description: 'Test application description 1',
        applicationOwner: 'me1@example.com',
        estateId: 'est-pt6oeb2u11',
        pipelineProvisionStatus: 'ACTIVE',
        createTime: '2021-11-28T17:01:46.827Z',
        lastUpdateTime: '2021-11-28T17:07:57.165Z',
    },
    {
        name: 'App1640624509697',
        description: 'Test application description 2',
        applicationOwner: 'me2@example.com',
        estateId: 'est-pt6oeb2u12',
        pipelineProvisionStatus: 'CREATE_FAILED',
        createTime: '2021-12-27T17:01:56.198Z',
        lastUpdateTime: '2021-12-27T17:08:39.143Z',
    },
];

describe('List Applications', () => {
    let useMutationOptions: any;

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
    });

    beforeAll(() => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        mockedUseAgsMutation.mockImplementation(
            (_mutationType: string, options?: any) => {
                useMutationOptions = options;
                return {
                    isLoading: false,
                    mutate: mockMutateFn,
                };
            }
        );
    });

    test('render application list page with empty list of applications - negative scenario', () => {
        mockedUseAgsListQuery.mockImplementation((_queryType: string) => ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
        }));
        // Render
        const { getByText, getByRole } = render(
            <BrowserRouter>
                <ApplicationsContainer />
            </BrowserRouter>
        );
        // Assertions
        expect(getByText('Applications (0)')).toBeInTheDocument();
        expect(getByText(/no records found/i)).toBeInTheDocument();

        // Check buttons state
        expect(getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(getByRole('button', { name: 'Delete' })).toBeDisabled();
        expect(getByRole('button', { name: 'Update' })).toBeInTheDocument();
        expect(getByRole('button', { name: 'Update' })).toBeDisabled();
        expect(getByRole('button', { name: 'Add new Application' })).toBeInTheDocument();
        expect(getByRole('button', { name: 'Add new Application' })).toBeEnabled();
    });

    test('render application list page with list of applications and delete error response - negative scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onError!(new Error('test error'), {});
        });

        mockedUseAgsListQuery.mockImplementation((_queryType: string) => ({
            data: fixtureListApplicationsData,
            isLoading: false,
            isError: false,
            error: null,
        }));

        // Render
        const { getByText, getAllByText, getByRole, getAllByRole } = render(
            <BrowserRouter>
                <ApplicationsContainer />
            </BrowserRouter>
        );

        // Assertions
        expect(
            getByText(`Applications (${fixtureListApplicationsData.length})`)
        ).toBeInTheDocument();
        fixtureListApplicationsData.forEach((application) => {
            expect(getByText(application.name)).toBeInTheDocument();
            expect(getByText(application.description)).toBeInTheDocument();
        });

        // Check buttons state
        expect(getAllByText('Delete')[0].parentElement).toBeDisabled();
        expect(getByText('Update').parentElement).toBeDisabled();
        expect(getByText('Add new Application').parentElement).toBeEnabled();

        // correct number of radio buttons for selection
        expect(getAllByRole('radio').length).toBe(fixtureListApplicationsData.length);

        // select an application
        await act(async () => {
            const radioButton = getAllByRole('radio')[1];
            radioButton.click();
        });

        await waitFor(() => {
            expect(getAllByText('Delete')[0].parentElement).toBeEnabled();
            expect(getByText('Update').parentElement).toBeEnabled();
        });

        act(() => {
            fireEvent.click(getAllByText('Delete')[0]);
        });

        // Confirm delete
        act(() => {
            fireEvent.change(getByRole('textbox'), {
                target: { value: 'delete' },
            });
        });
        act(() => {
            fireEvent.click(getAllByText('Delete')[1]);
        });

        expect(mockMutateFn).toHaveBeenCalledWith({
            name: fixtureListApplicationsData[0].name,
            forceDelete: true,
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            type: 'error',
            header: `Delete Application ${fixtureListApplicationsData[0].name} Failed.`,
            content: 'test error',
            dismissible: true,
        });
    });

    test('render application list page with list of applications and delete success response - positive scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onSuccess!({});
        });

        mockedUseAgsListQuery.mockImplementation((_queryType: string) => ({
            data: fixtureListApplicationsData,
            isLoading: false,
            isError: false,
            error: null,
        }));

        // Render
        const { getByText, getAllByText, getByRole, getAllByRole } = render(
            <BrowserRouter>
                <ApplicationsContainer />
            </BrowserRouter>
        );

        // Assertions
        expect(
            getByText(`Applications (${fixtureListApplicationsData.length})`)
        ).toBeInTheDocument();
        fixtureListApplicationsData.forEach((application) => {
            expect(getByText(application.name)).toBeInTheDocument();
            expect(getByText(application.description)).toBeInTheDocument();
        });

        // Check buttons state
        expect(getAllByText('Delete')[0].parentElement).toBeDisabled();
        expect(getByText('Update').parentElement).toBeDisabled();
        expect(getByText('Add new Application').parentElement).toBeEnabled();

        // correct number of radio buttons for selection
        expect(getAllByRole('radio').length).toBe(fixtureListApplicationsData.length);

        // select an application
        await act(async () => {
            const radioButton = getAllByRole('radio')[1];
            radioButton.click();
        });

        await waitFor(() => {
            expect(getAllByText('Delete')[0].parentElement).toBeEnabled();
            expect(getByText('Update').parentElement).toBeEnabled();
        });

        act(() => {
            fireEvent.click(getAllByText('Delete')[0]);
        });

        // Confirm delete
        act(() => {
            fireEvent.change(getByRole('textbox'), {
                target: { value: 'delete' },
            });
        });
        act(() => {
            fireEvent.click(getAllByText('Delete')[1]);
        });

        expect(mockMutateFn).toHaveBeenCalledWith({
            name: fixtureListApplicationsData[0].name,
            forceDelete: true,
        });
        // Assert success notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            type: 'success',
            header: `Delete Application ${fixtureListApplicationsData[0].name} Succeeded.`,
            dismissible: true,
        });
    });
});
