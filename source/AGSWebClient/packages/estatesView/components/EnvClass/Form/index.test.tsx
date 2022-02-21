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
import EnvClassForm from '.';
import { BrowserRouter } from 'react-router-dom';

describe('ApplicationForm', () => {
    test('render create', () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();
        const defaultValues = {
            name: '',
            description: '',
        };

        const { getByLabelText, getByText } = render(
            <BrowserRouter>
                <EnvClassForm
                    initialValues={defaultValues}
                    onCancel={mockOnCancel}
                    onSubmit={mockOnSubmit}
                />
            </BrowserRouter>
        );

        expect(getByText('Create New Environment Class')).toBeInTheDocument();
        expect(getByText('EnvClass name')).toBeInTheDocument();
        expect(
            getByText('A unique name for the new environment class')
        ).toBeInTheDocument();
        expect(getByText('Description')).toBeInTheDocument();
        expect(
            getByText('A description for the new environment class.')
        ).toBeInTheDocument();

        act(() => {
            fireEvent.change(getByLabelText('EnvClass name'), {
                target: { value: 'TestApplication' },
            });
            fireEvent.change(getByLabelText('Description'), {
                target: { value: 'This is a test application' },
            });
            fireEvent.click(getByText('Submit'));
        });

        expect(mockOnSubmit).toBeCalledWith(
            {
                name: 'TestApplication',
                description: 'This is a test application',
            },
            expect.any(Object),
            expect.any(Function)
        );
    });
});
