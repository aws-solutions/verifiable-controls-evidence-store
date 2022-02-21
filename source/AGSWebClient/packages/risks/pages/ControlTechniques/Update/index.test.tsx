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
import ControlTechniqueUpdate from '.';
import { useAgsQuery, useAgsMutation } from '@ags/webclient-core/queries';
import {
    controlTechniqueUpdateFormNavigateAndAssert,
    fixtureCreateControlTechniqueRestType,
    fixtureUpdateControlTechniqueRestType,
} from '../../../../risksView/components/ControlTechniques/Form/index.test';

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

const mockedUseAgsQuery = useAgsQuery as jest.Mock<any>;
const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;

describe('Update Control technique Page', () => {
    let useMutationOptions: any;

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
        mockUseHistoryReplaceFn.mockRestore();
    });

    beforeAll(() => {
        mockedUseAgsQuery.mockImplementation(() => ({
            isLoading: false,
            data: {
                ...fixtureCreateControlTechniqueRestType,
                enabled: true,
            },
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
                name: fixtureUpdateControlTechniqueRestType.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <ControlTechniqueUpdate />
            </BrowserRouter>
        );

        // form specific assertions
        await controlTechniqueUpdateFormNavigateAndAssert(renderResult);

        // page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith({
            ...fixtureUpdateControlTechniqueRestType,
            enabled: true,
            techniqueDetails: {
                ...fixtureUpdateControlTechniqueRestType.techniqueDetails,
                awsPolicyArn: '',
                detailType: '',
                eventBus: '',
            },
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            content: 'test error',
            dismissible: true,
            header: `Update Control Technique ${fixtureUpdateControlTechniqueRestType.name} Failed.`,
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
                name: fixtureUpdateControlTechniqueRestType.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <ControlTechniqueUpdate />
            </BrowserRouter>
        );

        // form specific assertions
        await controlTechniqueUpdateFormNavigateAndAssert(renderResult);

        // page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith({
            ...fixtureUpdateControlTechniqueRestType,
            enabled: true,
            techniqueDetails: {
                ...fixtureUpdateControlTechniqueRestType.techniqueDetails,
                awsPolicyArn: '',
                detailType: '',
                eventBus: '',
            },
        });
        // Assert success notification is called
        expect(mockUseHistoryReplaceFn).toHaveBeenCalledWith('/controltechniques/123', {
            notifications: [
                {
                    dismissible: true,
                    header: `Update Control Technique ${fixtureUpdateControlTechniqueRestType.name} Succeeded.`,
                    id: expect.any(String),
                    type: 'success',
                },
            ],
        });
        // Assert error notification has not been called
        expect(mockAddNotificationFn).not.toHaveBeenCalled();
    });
});
