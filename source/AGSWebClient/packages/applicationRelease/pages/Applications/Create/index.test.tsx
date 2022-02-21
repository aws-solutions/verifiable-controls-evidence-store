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
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ApplicationCreate from '.';
import { QueryType } from '@ags/webclient-application-release-core/queries';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import { when } from 'jest-when';
import {
    fixtureListEstatesData,
    appCreateFormNavigateAndAssert,
    fixtureCreateAppFormValues,
} from '../../../../applicationReleaseView/components/Applications/Form/index.test';

// Mocks
const mockMutateFn = jest.fn();
const mockUseHistoryReplaceFn = jest.fn();
const mockAddNotificationFn = jest.fn();

jest.mock('@ags/webclient-core/queries');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({
        replace: mockUseHistoryReplaceFn,
    }),
}));
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({
        addNotification: mockAddNotificationFn,
    }),
}));
const mockedUseAgsListQuery = useAgsListQuery as jest.Mock<any>;
const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;

const fixtureListAttributesData = [
    {
        name: 'dataClassification:group',
        description: 'dataClassification',
        key: 'dataClassification',
        value: 'group',
        metadata: {
            key1: 'value1',
        },
        createTime: '2021-11-17T06:01:51.389Z',
        lastUpdateTime: '2021-11-17T06:01:51.389Z',
        isMandatory: true,
    },
    {
        name: 'dataClassification:confidential',
        description: 'dataClassification',
        key: 'dataClassification',
        value: 'confidential',
        metadata: {
            key1: 'value1',
        },
        createTime: '2021-11-17T06:01:59.024Z',
        lastUpdateTime: '2021-11-17T06:01:59.024Z',
        isMandatory: true,
    },
    {
        name: 'hostingConstruct:lambda',
        description: 'hostingConstruct',
        key: 'hostingConstruct',
        value: 'lambda',
        metadata: {
            key1: 'value1',
        },
        createTime: '2021-11-17T06:02:15.035Z',
        lastUpdateTime: '2021-11-17T06:02:15.035Z',
        isMandatory: true,
    },
    {
        name: 'hostingConstruct:ec2',
        description: 'hostingConstruct',
        key: 'hostingConstruct',
        value: 'ec2',
        metadata: {
            key1: 'value1',
        },
        createTime: '2021-11-17T06:02:19.232Z',
        lastUpdateTime: '2021-11-17T06:02:19.232Z',
        isMandatory: true,
    },
    {
        name: 'testAttribute:testAttrValue',
        description: 'testAttribute',
        key: 'testAttribute',
        value: 'testAttrValue',
        metadata: {
            key1: 'value1',
        },
        createTime: '2021-11-17T06:02:52.748Z',
        lastUpdateTime: '2021-11-17T06:02:52.748Z',
        isMandatory: false,
    },
];

describe('Create Application Page', () => {
    let useMutationOptions: any;

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
        mockUseHistoryReplaceFn.mockRestore();
    });

    beforeAll(() => {
        const mockUseAgsListQueryfn = jest.fn();
        when(mockUseAgsListQueryfn)
            .calledWith(QueryType.LIST_ALL_ATTRIBUTES)
            .mockReturnValue({
                isLoading: false,
                data: fixtureListAttributesData,
                isError: false,
                error: null,
            });

        when(mockUseAgsListQueryfn)
            .calledWith(QueryType.LIST_ALL_ESTATES)
            .mockReturnValue({
                isLoading: false,
                data: fixtureListEstatesData,
                isError: false,
                error: null,
            });
        mockedUseAgsListQuery.mockImplementation(mockUseAgsListQueryfn);

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

    test('render page and submit - failure scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onError!(new Error('test error'), {
                name: fixtureCreateAppFormValues.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <ApplicationCreate />
            </BrowserRouter>
        );

        // Application form specific assertions
        await appCreateFormNavigateAndAssert(renderResult);

        // Application page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith({
            name: fixtureCreateAppFormValues.name,
            applicationOwner: fixtureCreateAppFormValues.applicationOwner,
            description: fixtureCreateAppFormValues.description,
            attributes: Object.fromEntries(
                fixtureCreateAppFormValues.attributes!.map((item) => [
                    item.key,
                    item.value,
                ])
            ),
            estateId: fixtureCreateAppFormValues.estate.split(':')[1],
            environmentIds: fixtureCreateAppFormValues.environments.map(
                (item) => item.value
            ),
            metadata: Object.fromEntries(
                fixtureCreateAppFormValues.metadata!.map((item) => [item.key, item.value])
            ),
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            content: 'test error',
            dismissible: true,
            header: `Create Application ${fixtureCreateAppFormValues.name} Failed.`,
            id: expect.any(String),
            type: 'error',
        });
        // OnError shouldn't invoke useHistory.replace
        expect(mockUseHistoryReplaceFn).not.toHaveBeenCalled();
    });

    test('render page and submit - success scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onSuccess!({
                name: fixtureCreateAppFormValues.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <ApplicationCreate />
            </BrowserRouter>
        );

        // Application form specific assertions
        await appCreateFormNavigateAndAssert(renderResult);

        // Application page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith({
            name: fixtureCreateAppFormValues.name,
            applicationOwner: fixtureCreateAppFormValues.applicationOwner,
            description: fixtureCreateAppFormValues.description,
            attributes: Object.fromEntries(
                fixtureCreateAppFormValues.attributes!.map((item) => [
                    item.key,
                    item.value,
                ])
            ),
            estateId: fixtureCreateAppFormValues.estate.split(':')[1],
            environmentIds: fixtureCreateAppFormValues.environments.map(
                (item) => item.value
            ),
            metadata: Object.fromEntries(
                fixtureCreateAppFormValues.metadata!.map((item) => [item.key, item.value])
            ),
        });
        // Assert success notification is called
        expect(mockUseHistoryReplaceFn).toHaveBeenCalledWith(
            `/applications/${fixtureCreateAppFormValues.name}`,
            {
                notifications: [
                    {
                        dismissible: true,
                        header: `Create Application ${fixtureCreateAppFormValues.name} Succeeded.`,
                        id: expect.any(String),
                        type: 'success',
                    },
                ],
            }
        );
        // Assert error notification has not been called
        expect(mockAddNotificationFn).not.toHaveBeenCalled();
    });
});
