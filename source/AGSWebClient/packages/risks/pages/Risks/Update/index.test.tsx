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
import RiskUpdate from '.';
import { QueryType } from '@ags/webclient-risks-core/queries';
import {
    useAgsQuery,
    useAgsListQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import {
    fixtureInitialValues,
    fixtureUpdateRiskValues,
    fixtureControlObjectives,
    fixtureCreateRiskValues,
    fixtureRiskOptions,
    riskUpdateFormNavigateAndAssert,
} from '@ags/webclient-risks-view/components/Risks/Form/index.test';
import { when } from 'jest-when';

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
        riskId: fixtureUpdateRiskValues.name,
    }),
}));
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({
        addNotification: mockAddNotificationFn,
    }),
}));
const mockedUseAgsListQuery = useAgsListQuery as jest.Mock<any>;
const mockedUseAgsQuery = useAgsQuery as jest.Mock<any>;
const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;

const fixtureGetRiskDetails = {
    id: '0d8ec7db-8d21-45c2-afd8-3d6106a5d4b3',
    name: fixtureInitialValues.name,
    description: fixtureInitialValues.description,
    category: fixtureInitialValues.category,
    severity: fixtureInitialValues.severity,
    likelihood: fixtureInitialValues.likelihood,
    rating: fixtureInitialValues.rating,
    controlObjectiveIds: [fixtureInitialValues.controlObjectives!.map((item) => item.id)],
};

describe('Update Risk Page', () => {
    let useMutationOptions: any;

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
        mockUseHistoryReplaceFn.mockRestore();
    });

    beforeAll(() => {
        const mockUseAgsQueryfn = jest.fn();
        when(mockUseAgsQueryfn)
            .calledWith(QueryType.GET_RISK, expect.any(String))
            .mockReturnValue({
                isLoading: false,
                data: fixtureGetRiskDetails,
                isError: false,
                error: null,
            });

        when(mockUseAgsQueryfn).calledWith(QueryType.GET_RISK_OPTIONS).mockReturnValue({
            isLoading: false,
            data: fixtureRiskOptions,
            isError: false,
            error: null,
        });
        mockedUseAgsQuery.mockImplementation(mockUseAgsQueryfn);

        mockedUseAgsListQuery.mockImplementation(() => ({
            isLoading: false,
            data: fixtureControlObjectives,
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
                name: fixtureUpdateRiskValues.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <RiskUpdate />
            </BrowserRouter>
        );

        //  form specific assertions
        await riskUpdateFormNavigateAndAssert(renderResult);

        // page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith({
            id: fixtureUpdateRiskValues.name,
            name: fixtureUpdateRiskValues.name,
            description: fixtureUpdateRiskValues.description,
            category: fixtureUpdateRiskValues.category,
            severity: fixtureUpdateRiskValues.severity,
            likelihood: fixtureUpdateRiskValues.likelihood,
            rating: fixtureUpdateRiskValues.rating,
            controlObjectiveIds: fixtureUpdateRiskValues.controlObjectives ?? [],
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            content: 'test error',
            dismissible: true,
            header: `Update Risk ${fixtureUpdateRiskValues.name} Failed.`,
            id: expect.any(String),
            type: 'error',
        });
        // OnError shouldn't invoke useHistory.replace
        expect(mockUseHistoryReplaceFn).not.toHaveBeenCalled();
    });

    test('render page and submit - success scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onSuccess!({
                id: fixtureCreateRiskValues.name,
                name: fixtureCreateRiskValues.name,
            });
        });

        const renderResult = render(
            <BrowserRouter>
                <RiskUpdate />
            </BrowserRouter>
        );

        // form specific assertions
        await riskUpdateFormNavigateAndAssert(renderResult);

        // page specific assertions
        expect(mockMutateFn).toHaveBeenCalledWith({
            id: fixtureUpdateRiskValues.name,
            name: fixtureUpdateRiskValues.name,
            description: fixtureUpdateRiskValues.description,
            category: fixtureUpdateRiskValues.category,
            severity: fixtureUpdateRiskValues.severity,
            likelihood: fixtureUpdateRiskValues.likelihood,
            rating: fixtureUpdateRiskValues.rating,
            controlObjectiveIds: fixtureUpdateRiskValues.controlObjectives ?? [],
        });
        // Assert success notification is called
        expect(mockUseHistoryReplaceFn).toHaveBeenCalledWith(
            `/risks/${fixtureCreateRiskValues.name}`,
            {
                notifications: [
                    {
                        dismissible: true,
                        header: `Update Risk ${fixtureCreateRiskValues.name} Succeeded.`,
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
