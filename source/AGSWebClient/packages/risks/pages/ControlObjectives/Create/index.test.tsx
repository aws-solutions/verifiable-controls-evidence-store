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
import ControlObjectiveCreate from '.';
import { useAgsMutation, useAgsListQuery } from '@ags/webclient-core/queries';
import {
    controlObjCreateFormNavigateAndAssert,
    fixtureCreateControlObjective,
} from '../../../../risksView/components/ControlObjectives/Form/index.test';
import { ControlTechniqueSummary } from '@ags/webclient-risks-core/types';

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

const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;
const mockedUseAgsListQuery = useAgsListQuery as jest.Mock<any>;

const fixtureListControlTechniques: ControlTechniqueSummary[] = [
    {
        id: 'e8041bfa-7bfe-4479-b68b-91c792d74885',
        name: 'ct1',
        description: 'description1',
        controlType: 'DETECTIVE',
    },
    {
        id: '003bfc58-fac8-46d9-b75d-3ef206f4d05f',
        name: 'ct2',
        description: 'description2',
        controlType: 'PREVENTIVE',
    },
    {
        id: 'a8c2fb4f-3cf2-477d-aa10-7a6bdcbe28c6',
        name: 'ct3',
        description: 'description3',
        controlType: 'DETECTIVE',
    },
];

describe('Create Control Objective Page', () => {
    let useMutationOptions: any;

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
        mockUseHistoryReplaceFn.mockRestore();
    });

    beforeAll(() => {
        mockedUseAgsListQuery.mockImplementation(() => ({
            isLoading: false,
            data: fixtureListControlTechniques,
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

    test('render page and submit - failure scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onError!(new Error('test error'), {
                name: fixtureCreateControlObjective.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <ControlObjectiveCreate />
            </BrowserRouter>
        );

        // form specific assertions
        await controlObjCreateFormNavigateAndAssert(renderResult);

        // page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith(fixtureCreateControlObjective);
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            content: 'test error',
            dismissible: true,
            header: `Create Control Objective ${fixtureCreateControlObjective.name} Failed.`,
            id: expect.any(String),
            type: 'error',
        });
        // OnError shouldn't invoke useHistory.replace
        expect(mockUseHistoryReplaceFn).not.toHaveBeenCalled();
    });

    test('render page and submit - success scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onSuccess!({
                id: '123',
                name: fixtureCreateControlObjective.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <ControlObjectiveCreate />
            </BrowserRouter>
        );

        // form specific assertions
        await controlObjCreateFormNavigateAndAssert(renderResult);

        // page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith(fixtureCreateControlObjective);
        // Assert success notification is called
        expect(mockUseHistoryReplaceFn).toHaveBeenCalledWith('/controlobjectives/123', {
            notifications: [
                {
                    dismissible: true,
                    header: `Create Control Objective ${fixtureCreateControlObjective.name} Succeeded.`,
                    id: expect.any(String),
                    type: 'success',
                },
            ],
        });
        // Assert error notification has not been called
        expect(mockAddNotificationFn).not.toHaveBeenCalled();
    });
});
