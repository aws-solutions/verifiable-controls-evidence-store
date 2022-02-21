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
import { render, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AttributeDetail from '.';
import { useAgsQuery, useAgsMutation } from '@ags/webclient-core/queries';
import { UserGroup } from '@ags/webclient-core/types';
import * as appContext from '@ags/webclient-core/containers/AppContext';
import { Attribute } from '@ags/webclient-application-release-core/types';

// Mocks
const mockMutateFn = jest.fn();
const mockUseHistoryReplaceFn = jest.fn();
const mockUseHistoryPushFn = jest.fn();
const mockAddNotificationFn = jest.fn();

jest.mock('@ags/webclient-core/containers/AppContext');
jest.mock('@ags/webclient-core/queries');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({
        push: mockUseHistoryPushFn,
        replace: mockUseHistoryReplaceFn,
    }),
    useParams: () => ({
        attributeId: fixtureGetAttribute.name,
    }),
}));
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({
        addNotification: mockAddNotificationFn,
    }),
}));
const mockedUseAgsQuery = useAgsQuery as jest.Mock<any>;
const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;

const fixtureGetAttribute: Attribute = {
    name: 'hostingConstruct:lambda',
    description: 'hostingConstruct',
    key: 'hostingConstruct',
    value: 'lambda',
    metadata: {
        key1: 'value1',
    },
    createTime: '2021-11-17T06:02:15.035Z',
    lastUpdateTime: '2021-11-17T06:02:15.035Z',
};

describe('Attribute Details Page', () => {
    let useMutationOptions: any;

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
        mockUseHistoryReplaceFn.mockRestore();
    });

    beforeAll(() => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        mockedUseAgsQuery.mockImplementation(() => ({
            isLoading: false,
            data: fixtureGetAttribute,
            isError: false,
            error: null,
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

    test('render page', async () => {
        const { getByText, getAllByText } = render(
            <BrowserRouter>
                <AttributeDetail />
            </BrowserRouter>
        );

        // General Information
        expect(getByText('General Information')).toBeInTheDocument();
        expect(getAllByText('Key').length).toBeGreaterThan(0);
        expect(getAllByText(fixtureGetAttribute.key).length).toBeGreaterThan(0);
        expect(getAllByText('Value').length).toBeGreaterThan(0);
        expect(getByText(fixtureGetAttribute.value)).toBeInTheDocument();
        expect(getByText('Description')).toBeInTheDocument();
        expect(getAllByText(fixtureGetAttribute.description).length).toBeGreaterThan(0);

        // Metadata
        expect(
            getByText(
                `Attribute MetaData (${Object.keys(fixtureGetAttribute.metadata).length})`
            )
        ).toBeInTheDocument();
        Object.entries(fixtureGetAttribute.metadata).forEach(([key, value]) => {
            expect(getByText(key)).toBeInTheDocument();
            expect(getByText(value)).toBeInTheDocument();
        });
    });

    test('render page - edit attribute', async () => {
        const { getByText } = render(
            <BrowserRouter>
                <AttributeDetail />
            </BrowserRouter>
        );

        expect(getByText('Edit')).toBeInTheDocument();
        act(() => {
            fireEvent.click(getByText('Edit'));
        });
        expect(mockUseHistoryPushFn).toHaveBeenCalledWith(
            `/attributes/${fixtureGetAttribute.name}/update`
        );
    });

    test('render page - delete attribute - negative scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onError!(new Error('test error'), {});
        });

        const { getAllByText, getByRole } = render(
            <BrowserRouter>
                <AttributeDetail />
            </BrowserRouter>
        );

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
            name: fixtureGetAttribute.name,
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            type: 'error',
            header: `Delete Attribute ${fixtureGetAttribute.name} Failed.`,
            content: 'test error',
            dismissible: true,
        });
        expect(mockUseHistoryReplaceFn).not.toHaveBeenCalled();
    });

    test('render page - delete attribute - positive scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onSuccess!({});
        });

        const { getAllByText, getByRole } = render(
            <BrowserRouter>
                <AttributeDetail />
            </BrowserRouter>
        );

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
            name: fixtureGetAttribute.name,
        });

        expect(mockUseHistoryReplaceFn).toHaveBeenCalledWith(`/attributes`, {
            notifications: [
                {
                    id: expect.any(String),
                    type: 'success',
                    header: `Delete Attribute ${fixtureGetAttribute.name} Succeeded.`,
                    dismissible: true,
                },
            ],
        });
        // Assert error notification has not been called
        expect(mockAddNotificationFn).not.toHaveBeenCalled();
    });
});
