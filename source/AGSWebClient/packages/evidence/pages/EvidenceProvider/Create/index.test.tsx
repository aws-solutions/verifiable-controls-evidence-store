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
import { useAgsMutation } from '@ags/webclient-core/queries';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CreateEvidenceProvider from '.';
import { BrowserRouter } from 'react-router-dom';

const mockAddNotificationFn = jest.fn();
const mockMutateFn = jest.fn();
const mockUseHistoryFn = jest.fn();

jest.mock('@ags/webclient-core/containers/AppContext');
jest.mock('@ags/webclient-core/queries');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({ replace: mockUseHistoryFn }),
}));
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({
        addNotification: mockAddNotificationFn,
    }),
}));

const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;

describe('Create provider page', () => {
    let mutationOptions: any;

    beforeAll(() => {
        mockedUseAgsMutation.mockImplementation((_: string, options: any) => {
            mutationOptions = options;
            return { isLoading: false, mutate: mockMutateFn };
        });
    });

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
        mockUseHistoryFn.mockRestore();
    });

    test('render page and submit - failure scenario', async () => {
        // arrange
        mockMutateFn.mockImplementation((_: any) => {
            mutationOptions?.onError!(new Error('test error'));
        });

        render(
            <BrowserRouter>
                <CreateEvidenceProvider />
            </BrowserRouter>
        );

        // act
        await act(async () => {
            fireEvent.change(screen.getByLabelText('Evidence Provider Name'), {
                target: { value: 'my-provider' },
            });
            fireEvent.change(screen.getByLabelText('Description'), {
                target: { value: 'my description' },
            });

            fireEvent.click(screen.getByText('Add Evidence Schema'));

            fireEvent.change(await screen.findByLabelText('Schema Id'), {
                target: { value: 'my-schema' },
            });
            fireEvent.change(await screen.findByLabelText('Schema'), {
                target: { value: '{"succeed":true}' },
            });
        });

        act(() => {
            fireEvent.click(screen.getByText('Submit'));
        });

        // assert
        expect(mockMutateFn).toHaveBeenCalledWith({
            name: 'my-provider',
            description: 'my description',
            schemas: [{ schemaId: 'my-schema', content: { succeed: true } }],
        });
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            type: 'error',
            header: 'Failed to record a new evidence provider with the provided details.',
            content: 'test error',
            dismissible: true,
        });
    });

    test('render page and submit - happy scenario', async () => {
        // arrange
        mockMutateFn.mockImplementation((_: any) => {
            mutationOptions?.onSuccess!({});
        });

        render(
            <BrowserRouter>
                <CreateEvidenceProvider />
            </BrowserRouter>
        );

        // act
        await act(async () => {
            fireEvent.change(screen.getByLabelText('Evidence Provider Name'), {
                target: { value: 'my-provider' },
            });
            fireEvent.change(screen.getByLabelText('Description'), {
                target: { value: 'my description' },
            });

            fireEvent.click(screen.getByText('Add Evidence Schema'));

            fireEvent.change(await screen.findByLabelText('Schema Id'), {
                target: { value: 'my-schema' },
            });
            fireEvent.change(await screen.findByLabelText('Schema'), {
                target: { value: '{"succeed":true}' },
            });
        });

        act(() => {
            fireEvent.click(screen.getByText('Submit'));
        });

        // assert
        expect(mockMutateFn).toHaveBeenCalledWith({
            name: 'my-provider',
            description: 'my description',
            schemas: [{ schemaId: 'my-schema', content: { succeed: true } }],
        });
        expect(mockAddNotificationFn).not.toHaveBeenCalled();
    });
});
