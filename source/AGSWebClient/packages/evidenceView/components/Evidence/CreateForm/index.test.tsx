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
import { fireEvent, render } from '@testing-library/react';
import CreateEvidenceForm from '.';
import { BrowserRouter } from 'react-router-dom';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';
import { act } from 'react-dom/test-utils';

const providers: EvidenceProvider[] = [
    {
        providerId: 'authority1',
        name: 'authority',
        createdTimestamp: new Date().toISOString(),
        description: '',
        enabled: true,
        schemas: [{ schemaId: 'schema-123' }],
    },
];
describe('Evidence create view tests', () => {
    test('render with evidence create form', () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const { getByText, getAllByRole, getAllByTestId, getByLabelText, container } =
            render(
                <BrowserRouter>
                    <CreateEvidenceForm
                        initialValues={{
                            providerId: 'authority1',
                            schemaId: 'schema-123',
                        }}
                        providers={providers}
                        onSubmit={mockOnSubmit}
                        onCancel={mockOnCancel}
                        isSubmitting={false}
                    ></CreateEvidenceForm>
                </BrowserRouter>
            );

        expect(getByText('Evidence Provider')).toBeInTheDocument();
        expect(getByText('API Key')).toBeInTheDocument();
        expect(getByText('Evidence Schema')).toBeInTheDocument();
        expect(getByText('Evidence Target Id')).toBeInTheDocument();
        expect(getByText('Evidence Content')).toBeInTheDocument();
        expect(getAllByRole('textbox').length).toBe(2);
        expect(getAllByTestId('select').length).toBe(2);

        act(() => {
            fireEvent.change(
                getAllByRole('textbox').filter((x) => x.id === 'targetId')[0],
                { target: { value: 'my-target' } }
            );
            fireEvent.change(
                container.getElementsByTagName('input').namedItem('apiKey')!,
                {
                    target: { value: 'my-apikey' },
                }
            );
            fireEvent.change(getByLabelText('content'), {
                target: { value: '{"succeed":true}' },
            });
            fireEvent.click(getByText('Submit'));
        });

        expect(mockOnSubmit).toBeCalledWith(
            {
                providerId: 'authority1',
                schemaId: 'schema-123',
                targetId: 'my-target',
                apiKey: 'my-apikey',
                content: '{"succeed":true}',
            },
            expect.any(Object),
            expect.any(Function)
        );

        act(() => {
            fireEvent.click(getByText('Cancel'));
        });
        expect(mockOnCancel).toBeCalled();
    });
});
