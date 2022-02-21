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
import ControlObjectiveDetail from '.';
import {
    useAgsQuery,
    useAgsBatchQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import { UserGroup } from '@ags/webclient-core/types';
import * as appContext from '@ags/webclient-core/containers/AppContext';
import { ControlObjective } from '../../../../risksCore/types/controlObjective';
import { fixtureControlObjectiveInitialValues } from '../../../../risksView/components/ControlObjectives/Form/index.test';
import { ControlTechnique } from '@ags/webclient-risks-core/types';

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
const mockedUseAgsBatchQuery = useAgsBatchQuery as jest.Mock<any>;
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

const fixGetControlTechniquesBatch: ControlTechnique[] = [
    {
        enabled: true,
        controlType: 'PREVENTIVE',
        lastUpdateTime: '2021-09-20T14:52:39.147Z',
        status: 'ACTIVE',
        createTime: '2021-09-20T14:52:39.147Z',
        techniqueDetails: {
            integrationType: 'REST',
            restEndpoint: 'http://xyz',
        },
        description: 'description-ControlTechnique1',
        id: '003bfc58-fac8-46d9-b75d-3ef206f4d05f',
        name: 'ControlTechnique1',
        controlObjectives: ['4253afaa-df40-4287-b8f0-e1557fc1a230'],
    },
];

describe('Control technique Details Page', () => {
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
            data: fixtureGetControlObjective,
            isError: false,
            error: null,
        }));

        mockedUseAgsBatchQuery.mockImplementation(() => ({
            isLoading: false,
            isError: false,
            errors: [],
            data: fixGetControlTechniquesBatch,
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
                <ControlObjectiveDetail />
            </BrowserRouter>
        );

        // General Information
        expect(getByText('General Information')).toBeInTheDocument();
        expect(getAllByText('Name').length).toBeGreaterThan(0);
        expect(getAllByText(fixtureGetControlObjective.name!).length).toBeGreaterThan(0);
        expect(getAllByText('Description').length).toBeGreaterThan(0);
        expect(getByText(fixtureGetControlObjective.description!)).toBeInTheDocument();

        // Control techniques
        expect(
            getByText(
                `Fulfilled by ${fixGetControlTechniquesBatch.length} Control Technique`
            )
        ).toBeInTheDocument();
        expect(getByText(fixGetControlTechniquesBatch[0].name)).toBeInTheDocument();
        expect(
            getByText(fixGetControlTechniquesBatch[0].description)
        ).toBeInTheDocument();
        expect(
            getByText(fixGetControlTechniquesBatch[0].controlType)
        ).toBeInTheDocument();
    });

    test('render page - edit', async () => {
        const { getByText } = render(
            <BrowserRouter>
                <ControlObjectiveDetail />
            </BrowserRouter>
        );

        expect(getByText('Edit')).toBeInTheDocument();
        act(() => {
            fireEvent.click(getByText('Edit'));
        });
        expect(mockUseHistoryPushFn).toHaveBeenCalledWith(
            `/controlobjectives/${fixtureGetControlObjective.id}/update`
        );
    });

    test('render page - delete - negative scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onError!(new Error('test error'), {});
        });

        const { getAllByText, getByRole } = render(
            <BrowserRouter>
                <ControlObjectiveDetail />
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
            id: fixtureGetControlObjective.id,
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            type: 'error',
            header: `Delete Control Objective ${fixtureGetControlObjective.name} Failed.`,
            content: 'test error',
            dismissible: true,
        });
        expect(mockUseHistoryReplaceFn).not.toHaveBeenCalled();
    });

    test('render page - delete - positive scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onSuccess!({});
        });

        const { getAllByText, getByRole } = render(
            <BrowserRouter>
                <ControlObjectiveDetail />
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
            id: fixtureGetControlObjective.id,
        });

        expect(mockUseHistoryReplaceFn).toHaveBeenCalledWith(`/controlobjectives`, {
            notifications: [
                {
                    id: expect.any(String),
                    type: 'success',
                    header: `Delete Control Objective ${fixtureGetControlObjective.name} Succeeded.`,
                    dismissible: true,
                },
            ],
        });
        // Assert error notification has not been called
        expect(mockAddNotificationFn).not.toHaveBeenCalled();
    });
});
