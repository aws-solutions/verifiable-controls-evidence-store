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
import RiskDetail from '.';
import {
    useAgsQuery,
    useAgsBatchQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import { UserGroup } from '@ags/webclient-core/types';
import * as appContext from '@ags/webclient-core/containers/AppContext';
import { fixtureInitialValues } from '@ags/webclient-risks-view/components/Risks/Form/index.test';
import { ControlObjective } from '@ags/webclient-risks-core/types';

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
        riskId: fixtureGetRiskDetails.id,
    }),
}));
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({
        addNotification: mockAddNotificationFn,
    }),
}));
const mockedUseAgsQuery = useAgsQuery as jest.Mock<any>;
const mockedUseAgsBatchQuery = useAgsBatchQuery as jest.Mock<any>;
const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;

const fixtureGetRiskDetails = {
    id: fixtureInitialValues.name,
    name: fixtureInitialValues.name,
    description: fixtureInitialValues.description,
    category: fixtureInitialValues.category,
    severity: fixtureInitialValues.severity,
    likelihood: fixtureInitialValues.likelihood,
    rating: fixtureInitialValues.rating,
    controlObjectiveIds: [fixtureInitialValues.controlObjectives!.map((item) => item.id)],
};

const fixtureGetControlObjective: ControlObjective[] = [
    {
        lastUpdateTime: '2021-09-20T14:55:14.169Z',
        controlTechniqueIds: ['003bfc58-fac8-46d9-b75d-3ef206f4d05f'],
        createTime: '2021-09-20T14:55:14.169Z',
        description:
            'To ensure the valid application request is traceable the trace must be on for lambda hosting constructs.',
        id: '4253afaa-df40-4287-b8f0-e1557fc1a230',
        name: 'Lambda traffic is traceable',
    },
];

describe('Risk Details Page', () => {
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
            data: fixtureGetRiskDetails,
            isError: false,
            error: null,
        }));

        mockedUseAgsBatchQuery.mockImplementation(() => ({
            isLoading: false,
            isError: false,
            errors: [],
            data: fixtureGetControlObjective,
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
                <RiskDetail />
            </BrowserRouter>
        );

        // General Information
        expect(getByText('General Information')).toBeInTheDocument();
        expect(getAllByText('Name').length).toBeGreaterThan(0);
        expect(getAllByText(fixtureGetRiskDetails.name).length).toBeGreaterThan(0);
        expect(getAllByText('Description').length).toBeGreaterThan(0);
        expect(getAllByText(fixtureGetRiskDetails.description!).length).toBeGreaterThan(
            0
        );
        expect(getByText('Category')).toBeInTheDocument();
        expect(getByText(fixtureGetRiskDetails.category!)).toBeInTheDocument();
        expect(getByText('Severity')).toBeInTheDocument();
        expect(getByText(fixtureGetRiskDetails.severity!)).toBeInTheDocument();
        expect(getByText('Likelihood')).toBeInTheDocument();
        expect(getByText(fixtureGetRiskDetails.likelihood!)).toBeInTheDocument();
        expect(getByText('Rating')).toBeInTheDocument();
        expect(getByText(fixtureGetRiskDetails.rating!)).toBeInTheDocument();

        // Mitigated by
        expect(
            getByText(
                `Mitigated by ${fixtureGetControlObjective.length} Control Objective`
            )
        ).toBeInTheDocument();
        expect(getByText(fixtureGetControlObjective[0].name)).toBeInTheDocument();
        expect(getByText(fixtureGetControlObjective[0].description)).toBeInTheDocument();
    });

    test('render page - edit risk', async () => {
        const { getByText } = render(
            <BrowserRouter>
                <RiskDetail />
            </BrowserRouter>
        );

        expect(getByText('Edit')).toBeInTheDocument();
        act(() => {
            fireEvent.click(getByText('Edit'));
        });
        expect(mockUseHistoryPushFn).toHaveBeenCalledWith(
            `/risks/${fixtureGetRiskDetails.id}/update`
        );
    });

    test('render page - delete risk - negative scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onError!(new Error('test error'), {});
        });

        const { getAllByText, getByRole } = render(
            <BrowserRouter>
                <RiskDetail />
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
            id: fixtureGetRiskDetails.name,
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            type: 'error',
            header: `Delete Risk ${fixtureGetRiskDetails.name} Failed.`,
            content: 'test error',
            dismissible: true,
        });
        expect(mockUseHistoryReplaceFn).not.toHaveBeenCalled();
    });

    test('render page - delete risk - positive scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onSuccess!({});
        });

        const { getAllByText, getByRole } = render(
            <BrowserRouter>
                <RiskDetail />
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
            id: fixtureGetRiskDetails.name,
        });

        expect(mockUseHistoryReplaceFn).toHaveBeenCalledWith(`/risks`, {
            notifications: [
                {
                    id: expect.any(String),
                    type: 'success',
                    header: `Delete Risk ${fixtureGetRiskDetails.name} Succeeded.`,
                    dismissible: true,
                },
            ],
        });
        // Assert error notification has not been called
        expect(mockAddNotificationFn).not.toHaveBeenCalled();
    });
});
