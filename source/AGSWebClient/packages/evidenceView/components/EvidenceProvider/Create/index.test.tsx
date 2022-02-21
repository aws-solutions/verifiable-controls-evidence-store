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
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateEvidenceProviderForm from '.';

describe('Evidence provider create view tests', () => {
    test('render test', () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        render(
            <BrowserRouter>
                <CreateEvidenceProviderForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isSubmitting={false}
                    initialValues={{
                        name: 'test',
                        description: 'test',
                        schemas: [{ schemaId: 'schemaId', content: '{"succeed":true}' }],
                    }}
                ></CreateEvidenceProviderForm>
            </BrowserRouter>
        );
        expect(screen.getByText('Evidence Provider Name')).toBeInTheDocument();
        expect(screen.getByText('Evidence Provider Id')).toBeInTheDocument();
        expect(screen.getAllByRole('textbox').length).toBe(5);

        act(() => {
            fireEvent.change(
                screen.getAllByRole('textbox').filter((x) => x.id === 'providerId')[0],
                {
                    target: { value: 'my-provider' },
                }
            );
            fireEvent.change(
                screen.getAllByRole('textbox').filter((x) => x.id === 'description')[0],
                {
                    target: { value: 'a brief one' },
                }
            );
            fireEvent.change(
                screen.getAllByRole('textbox').filter((x) => x.id === 'name')[0],
                {
                    target: { value: 'my-provider-name' },
                }
            );
            fireEvent.click(screen.getByText('Submit'));
        });

        expect(mockOnSubmit).toBeCalledWith(
            {
                providerId: 'my-provider',
                name: 'my-provider-name',
                description: 'a brief one',
                schemas: [{ schemaId: 'schemaId', content: '{"succeed":true}' }],
            },
            expect.any(Object),
            expect.any(Function)
        );

        act(() => {
            fireEvent.click(screen.getByText('Cancel'));
        });

        expect(mockOnCancel).toBeCalled();
    });
});
