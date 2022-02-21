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
import ControlObjectiveUpdate from '.';
import {
    useAgsQuery,
    useAgsListQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import {
    controlObjUpdateFormNavigateAndAssert,
    fixtureControlObjectiveInitialValues,
    fixtureListAllControlTechniques,
    fixtureUpdateControlObjective,
} from '../../../../risksView/components/ControlObjectives/Form/index.test';
import { ControlObjective } from '@ags/webclient-risks-core/types';

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
    useParams: () => ({
        controlObjectiveId: fixtureGetControlObjective.id,
    }),
}));
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({
        addNotification: mockAddNotificationFn,
    }),
}));

const mockedUseAgsQuery = useAgsQuery as jest.Mock<any>;
const mockedUseAgsListQuery = useAgsListQuery as jest.Mock<any>;
const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;

const fixtureGetControlObjective: ControlObjective = {
    controlTechniqueIds: fixtureControlObjectiveInitialValues.controlTechniques?.map(
        (item) => item.id
    )!,
    lastUpdateTime: '2021-09-20T14:55:14.169Z',
    createTime: '2021-09-20T14:55:14.169Z',
    description: fixtureControlObjectiveInitialValues.description!,
    id: '4253afaa-df40-4287-b8f0-e1557fc1a230',
    name: fixtureControlObjectiveInitialValues.name,
};

describe('Update Control objective Page', () => {
    let useMutationOptions: any;

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
        mockUseHistoryReplaceFn.mockRestore();
    });

    beforeAll(() => {
        mockedUseAgsQuery.mockImplementation(() => ({
            isLoading: false,
            data: fixtureGetControlObjective,
            isError: false,
            error: null,
        }));
        mockedUseAgsListQuery.mockImplementation(() => ({
            isLoading: false,
            data: fixtureListAllControlTechniques,
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
                name: fixtureUpdateControlObjective.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <ControlObjectiveUpdate />
            </BrowserRouter>
        );

        // form specific assertions
        await controlObjUpdateFormNavigateAndAssert(renderResult);

        // page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith({
            ...fixtureUpdateControlObjective,
            id: fixtureGetControlObjective.id,
            controlTechniqueIds: fixtureGetControlObjective.controlTechniqueIds,
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            content: 'test error',
            dismissible: true,
            header: `Update Control Objective ${fixtureUpdateControlObjective.name} Failed.`,
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
                name: fixtureUpdateControlObjective.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <ControlObjectiveUpdate />
            </BrowserRouter>
        );

        // form specific assertions
        await controlObjUpdateFormNavigateAndAssert(renderResult);

        // page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith({
            ...fixtureUpdateControlObjective,
            id: fixtureGetControlObjective.id,
            controlTechniqueIds: fixtureGetControlObjective.controlTechniqueIds,
        });
        // Assert success notification is called
        expect(mockUseHistoryReplaceFn).toHaveBeenCalledWith('/controlobjectives/123', {
            notifications: [
                {
                    dismissible: true,
                    header: `Update Control Objective ${fixtureUpdateControlObjective.name} Succeeded.`,
                    id: expect.any(String),
                    type: 'success',
                },
            ],
        });
        // Assert error notification has not been called
        expect(mockAddNotificationFn).not.toHaveBeenCalled();
    });
});
