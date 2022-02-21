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
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateEvidence from '.';
import { useMutation } from 'react-query';
import { when } from 'jest-when';
import { QueryType } from '@ags/webclient-evidence-core/queries';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';

const mockMutateFn = jest.fn();
const mockAddNotificationFn = jest.fn();
const mockUseHistoryReplaceFn = jest.fn();

jest.mock('@ags/webclient-core/queries');
jest.mock('react-query');
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
const mockUseMutation = useMutation as jest.Mock<any>;

const providers: EvidenceProvider[] = [
    {
        providerId: 'provider',
        name: 'name',
        createdTimestamp: new Date().toISOString(),
        description: 'test',
        schemas: [{ schemaId: '1234' }],
        enabled: true,
    },
];

describe('create evidence tests', () => {
    let useMutationOptions: any;

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
        mockUseHistoryReplaceFn.mockRestore();
    });

    beforeAll(() => {
        const mockUseAgsListQueryfn = jest.fn();
        when(mockUseAgsListQueryfn)
            .calledWith(QueryType.LIST_EVIDENCE_PROVIDERS)
            .mockReturnValue({
                isLoading: false,
                data: providers,
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

        const mockUploadFn = jest.fn();

        mockUploadFn.mockReturnValue({ isLoading: false });
        mockUseMutation.mockImplementation(mockUploadFn);
    });

    test('render page and submit - unhappy case', async () => {
        // arrange
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onError!(new Error('test error'));
        });

        // act
        render(
            <BrowserRouter>
                <CreateEvidence />
            </BrowserRouter>
        );

        await setFormValues();

        act(() => {
            fireEvent.click(screen.getByText('Submit'));
        });

        // assert
        expect(mockMutateFn).toHaveBeenCalledWith({
            apiKey: 'my-api-key',
            attachments: undefined,
            targetId: 'my-target',
            content: { succeed: true },
            providerId: providers[0].providerId,
            schemaId: providers[0].schemas![0].schemaId!,
        });
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            content: 'test error',
            dismissible: true,
            header: 'Failed to record the provided evidence.',
            type: 'error',
        });
    });

    test('render page and submit - happy case', async () => {
        // arrange
        mockMutateFn.mockImplementation((_: any) => {
            useMutationOptions?.onSuccess({});
        });

        // act
        render(
            <BrowserRouter>
                <CreateEvidence />
            </BrowserRouter>
        );

        await setFormValues();

        act(() => {
            fireEvent.click(screen.getByText('Submit'));
        });

        expect(mockMutateFn).toHaveBeenCalledWith({
            apiKey: 'my-api-key',
            attachments: undefined,
            targetId: 'my-target',
            content: { succeed: true },
            providerId: providers[0].providerId,
            schemaId: providers[0].schemas![0].schemaId!,
        });
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            buttonText: 'View Evidence',
            header: 'Successfully recorded evidence with id undefined.',
            type: 'success',
            onButtonClick: expect.anything(),
        });
    });
});

async function setFormValues(): Promise<void> {
    act(() => {
        fireEvent.change(screen.getByLabelText('API Key'), {
            target: { value: 'my-api-key' },
        });
        fireEvent.change(screen.getByLabelText('Evidence Target Id'), {
            target: { value: 'my-target' },
        });
        fireEvent.change(screen.getByLabelText('Evidence Content'), {
            target: { value: '{"succeed":true}' },
        });
    });

    await act(async () => {
        // select provider
        fireEvent.mouseDown(screen.getAllByTestId('select')[0].children[0]);
        await act(async () => {
            const providerListbox = within(await screen.findByRole('listbox'));
            fireEvent.click(providerListbox.getByText('name'));
        });
    });

    await act(async () => {
        // select schema id
        fireEvent.mouseDown((await screen.findAllByTestId('select'))[1].children[0]);
        await act(async () => {
            const schemaListbox = within(await screen.findByRole('listbox'));
            fireEvent.click(schemaListbox.getByText('1234'));
        });
    });
}
