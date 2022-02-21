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
import BusinessUnitForm, { BusinessUnitFormData } from '.';
import { BrowserRouter } from 'react-router-dom';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';

const businessUnit: BusinessUnitFormData = {
    parentId: 'id-3',
    name: 'Test Business Unit',
    description: 'Description Test Business',
    businessOwner: 'business@test.com',
    riskOwner: 'risk@test.com',
    techOwner: 'tech@test.com',
};

const parentBusinessUnits: BusinessUnitSummary[] = [
    {
        id: 'id-1',
        parentId: '',
        name: 'Test Enterprise',
        unitType: 'Enterprise',
    },
    {
        id: 'id-2',
        parentId: 'id-1',
        name: 'Test BU 1',
        unitType: 'BusinessUnit',
    },
    {
        id: 'id-3',
        parentId: 'id-1',
        name: 'Test BU 2',
        unitType: 'BusinessUnit',
    },
];

const defaultValue: BusinessUnitFormData = {
    name: '',
    description: '',
    businessOwner: '',
};

describe('BusinessUnitForm', () => {
    test('render create with parent name', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const { getByText, getAllByRole, getByDisplayValue, findByText } = render(
            <BrowserRouter>
                <BusinessUnitForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    initialValues={{ ...defaultValue, parentName: 'Test Enterprise' }}
                />
            </BrowserRouter>
        );

        expect(getByText('Create Business Unit')).toBeInTheDocument();
        expect(getByDisplayValue('Test Enterprise')).toBeInTheDocument();
        expect(getByDisplayValue('Test Enterprise')).toBeDisabled();

        act(() => {
            fireEvent.change(
                getAllByRole('textbox').filter((element) => element.id === 'name')[0],
                { target: { value: 'Test Business Unit' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'description'
                )[0],
                { target: { value: 'Description Test Business' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'businessOwner'
                )[0],
                { target: { value: 'business@test.com' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'riskOwner'
                )[0],
                { target: { value: 'risk@test.com' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'techOwner'
                )[0],
                { target: { value: 'tech@test.com' } }
            );
        });
        expect(await findByText('Submit')).toBeVisible();
        fireEvent.click(getByText('Submit'));
        expect(mockOnSubmit).toBeCalledWith(
            {
                name: 'Test Business Unit',
                description: 'Description Test Business',
                businessOwner: 'business@test.com',
                riskOwner: 'risk@test.com',
                techOwner: 'tech@test.com',
                parentName: 'Test Enterprise',
            },
            expect.any(Object),
            expect.any(Function)
        );
    });

    test('render create with parent choice', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const { getByText, getAllByRole, getAllByTestId, findByText } = render(
            <BrowserRouter>
                <BusinessUnitForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    initialValues={defaultValue}
                    businessUnits={parentBusinessUnits}
                />
            </BrowserRouter>
        );

        expect(getByText('Create Business Unit')).toBeInTheDocument();
        act(() => {
            fireEvent.change(
                getAllByRole('textbox').filter((element) => element.id === 'name')[0],
                { target: { value: 'Test Business Unit' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'description'
                )[0],
                { target: { value: 'Description Test Business' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'businessOwner'
                )[0],
                { target: { value: 'business@test.com' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'riskOwner'
                )[0],
                { target: { value: 'risk@test.com' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'techOwner'
                )[0],
                { target: { value: 'tech@test.com' } }
            );
        });
        act(() => {
            fireEvent.change(getAllByTestId('select')[0].children[1], {
                target: { value: 'id-2' },
            });
            fireEvent.click(getAllByTestId('select')[0]);
        });
        expect(getByText('Test BU 1')).toBeInTheDocument();

        expect(await findByText('Submit')).toBeVisible();
        fireEvent.click(getByText('Submit'));
        expect(mockOnSubmit).toBeCalledWith(
            { ...businessUnit, parentId: 'id-2' },
            expect.any(Object),
            expect.any(Function)
        );
    });

    test('render update with parent choice', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const { getByText, getAllByRole, getAllByTestId, findByText, getByDisplayValue } =
            render(
                <BrowserRouter>
                    <BusinessUnitForm
                        onSubmit={mockOnSubmit}
                        onCancel={mockOnCancel}
                        isUpdate={true}
                        initialValues={businessUnit}
                        businessUnits={parentBusinessUnits}
                    />
                </BrowserRouter>
            );

        expect(getByText('Update Business Unit')).toBeInTheDocument();
        expect(getByText('Test BU 2')).toBeInTheDocument();
        expect(getByDisplayValue('Test Business Unit')).toBeInTheDocument();
        expect(getByText('Description Test Business')).toBeInTheDocument();
        expect(getByDisplayValue('business@test.com')).toBeInTheDocument();
        expect(getByDisplayValue('risk@test.com')).toBeInTheDocument();
        expect(getByDisplayValue('tech@test.com')).toBeInTheDocument();

        act(() => {
            fireEvent.change(getAllByTestId('select')[0].children[1], {
                target: { value: 'id-2' },
            });
            fireEvent.change(
                getAllByRole('textbox').filter((element) => element.id === 'name')[0],
                { target: { value: 'New Test Business Unit' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'description'
                )[0],
                { target: { value: 'New Description Test Business' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'businessOwner'
                )[0],
                { target: { value: 'newbusiness@test.com' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'riskOwner'
                )[0],
                { target: { value: 'newrisk@test.com' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'techOwner'
                )[0],
                { target: { value: 'newtech@test.com' } }
            );
        });
        expect(await findByText('Submit')).toBeVisible();
        fireEvent.click(getByText('Submit'));
        expect(mockOnSubmit).toBeCalledWith(
            {
                parentId: 'id-2',
                name: 'New Test Business Unit',
                description: 'New Description Test Business',
                businessOwner: 'newbusiness@test.com',
                riskOwner: 'newrisk@test.com',
                techOwner: 'newtech@test.com',
            },
            expect.any(Object),
            expect.any(Function)
        );
    });

    test('render create for enterprise', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const { getByText, queryByText } = render(
            <BrowserRouter>
                <BusinessUnitForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    initialValues={defaultValue}
                    isEnterprise={true}
                />
            </BrowserRouter>
        );

        expect(getByText('Create Enterprise')).toBeInTheDocument();
        expect(queryByText('Parent Business Unit')).not.toBeInTheDocument();
    });

    test('render create no initial value', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const { getByText } = render(
            <BrowserRouter>
                <BusinessUnitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            </BrowserRouter>
        );

        expect(getByText('Create Business Unit')).toBeInTheDocument();
    });
});
