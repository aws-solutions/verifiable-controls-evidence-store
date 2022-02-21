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
import { render, act, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import { AttributeSummary } from '@ags/webclient-application-release-core/types';
import { UserGroup } from '@ags/webclient-core/types';
import AttributesContainer from '.';
import * as appContext from '@ags/webclient-core/containers/AppContext';

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

const fixtureListAttributesData: AttributeSummary[] = [
    {
        name: 'hostingConstruct:lambda',
        key: 'hostingConstruct',
        value: 'lambda',
        createTime: '2021-11-17T06:02:15.035Z',
        lastUpdateTime: '2021-11-17T06:02:15.035Z',
        isMandatory: true,
    },
    {
        name: 'hostingConstruct:ec2',
        key: 'hostingConstruct',
        value: 'ec2',
        createTime: '2021-11-17T06:02:19.232Z',
        lastUpdateTime: '2021-11-17T06:02:19.232Z',
        isMandatory: true,
    },
    {
        name: 'testAttribute:testAttrValue',
        key: 'testAttribute',
        value: 'testAttrValue',
        createTime: '2021-11-17T06:02:52.748Z',
        lastUpdateTime: '2021-11-17T06:02:52.748Z',
        isMandatory: false,
    },
    {
        name: 'dataClassification:group',
        key: 'dataClassification',
        value: 'group',
        createTime: '2021-11-17T06:01:51.389Z',
        lastUpdateTime: '2021-11-17T06:01:51.389Z',
        isMandatory: true,
    },
    {
        name: 'dataClassification:confidential',
        key: 'dataClassification',
        value: 'confidential',
        createTime: '2021-11-17T06:01:59.024Z',
        lastUpdateTime: '2021-11-17T06:01:59.024Z',
        isMandatory: true,
    },
];

describe('List Attributes', () => {
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

    test('render attributes list page with empty list - negative scenario', () => {
        mockedUseAgsListQuery.mockImplementation((_queryType: string) => ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
        }));
        // Render
        const { getByText, getByRole } = render(
            <BrowserRouter>
                <AttributesContainer />
            </BrowserRouter>
        );
        // Assertions
        expect(getByText('Attributes (0)')).toBeInTheDocument();
        expect(getByText(/no records found/i)).toBeInTheDocument();

        // Check buttons state
        expect(getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(getByRole('button', { name: 'Delete' })).toBeDisabled();
        expect(getByRole('button', { name: 'Update' })).toBeInTheDocument();
        expect(getByRole('button', { name: 'Update' })).toBeDisabled();
        expect(getByRole('button', { name: 'Add new Attribute' })).toBeInTheDocument();
        expect(getByRole('button', { name: 'Add new Attribute' })).toBeEnabled();
    });

    test('render attribute list page with list of attributes and delete error response - negative scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onError!(new Error('test error'), {});
        });

        mockedUseAgsListQuery.mockImplementation((_queryType: string) => ({
            data: fixtureListAttributesData,
            isLoading: false,
            isError: false,
            error: null,
        }));

        // Render
        const { getByText, getAllByText, getByRole, getAllByRole } = render(
            <BrowserRouter>
                <AttributesContainer />
            </BrowserRouter>
        );

        // Assertions
        expect(
            getByText(`Attributes (${fixtureListAttributesData.length})`)
        ).toBeInTheDocument();
        fixtureListAttributesData.forEach((attribute) => {
            expect(getAllByText(attribute.key).length).toBeGreaterThan(0);
            expect(getByText(attribute.value)).toBeInTheDocument();
        });

        // Check buttons state
        expect(getAllByText('Delete')[0].parentElement).toBeDisabled();
        expect(getByText('Update').parentElement).toBeDisabled();
        expect(getByText('Add new Attribute').parentElement).toBeEnabled();

        // correct number of radio buttons for selection
        expect(getAllByRole('radio').length).toBe(fixtureListAttributesData.length);

        // select an attribute
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
            name: fixtureListAttributesData[1].name,
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            type: 'error',
            header: `Delete Attribute ${fixtureListAttributesData[1].name} Failed.`,
            content: 'test error',
            dismissible: true,
        });
    });

    test('render attribute list page with list of attributes and delete success response - positive scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onSuccess!({});
        });

        mockedUseAgsListQuery.mockImplementation((_queryType: string) => ({
            data: fixtureListAttributesData,
            isLoading: false,
            isError: false,
            error: null,
        }));

        // Render
        const { getByText, getAllByText, getByRole, getAllByRole } = render(
            <BrowserRouter>
                <AttributesContainer />
            </BrowserRouter>
        );

        // Assertions
        expect(
            getByText(`Attributes (${fixtureListAttributesData.length})`)
        ).toBeInTheDocument();
        fixtureListAttributesData.forEach((attribute) => {
            expect(getAllByText(attribute.key).length).toBeGreaterThan(0);
            expect(getByText(attribute.value)).toBeInTheDocument();
        });

        // Check buttons state
        expect(getAllByText('Delete')[0].parentElement).toBeDisabled();
        expect(getByText('Update').parentElement).toBeDisabled();
        expect(getByText('Add new Attribute').parentElement).toBeEnabled();

        // correct number of radio buttons for selection
        expect(getAllByRole('radio').length).toBe(fixtureListAttributesData.length);

        // select an attribute
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
            name: fixtureListAttributesData[1].name,
        });
        // Assert success notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            type: 'success',
            header: `Delete Attribute ${fixtureListAttributesData[1].name} Succeeded.`,
            dismissible: true,
        });
    });
});
