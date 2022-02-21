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
import { render, fireEvent, act, RenderResult } from '@testing-library/react';
import { ControlTechniqueSummary } from '@ags/webclient-risks-core/types';
import ControlObjectiveForm, { ControlObjectiveFormData } from '.';
import { BrowserRouter } from 'react-router-dom';

export const fixtureCreateControlObjective: ControlObjectiveFormData = {
    name: 'Test Control Objective',
    description: 'Description Test Control Objective',
};

export const fixtureUpdateControlObjective: ControlObjectiveFormData = {
    name: 'Updated Test Control Objective',
    description: 'Updated Description Test Control Objective',
};

export const fixtureControlObjectiveInitialValues: ControlObjectiveFormData = {
    ...fixtureCreateControlObjective,
    controlTechniques: [
        {
            id: 'ct-1',
        },
        {
            id: 'ct-2',
        },
    ],
};

export const fixtureListAllControlTechniques: ControlTechniqueSummary[] = [
    {
        id: 'ct-1',
        name: 'Control Technnique 1',
        controlType: 'PREVENTATIVE',
        description: 'Description of Control Technique 1',
    },
    {
        id: 'ct-2',
        name: 'Control Technnique 2',
        controlType: 'DETECTIVE',
        description: 'Description of Control Technique 2',
    },
];

export const controlObjCreateFormNavigateAndAssert = async (
    renderResult: RenderResult
) => {
    const { getByText, getAllByRole, getAllByText, findByText } = renderResult;
    expect(getByText('Create Control Objective')).toBeInTheDocument();
    expect(getAllByText('Control Objective Details').length).toBe(2);
    act(() => {
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'name')[0],
            { target: { value: fixtureCreateControlObjective.name } }
        );
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'description')[0],
            { target: { value: fixtureCreateControlObjective.description } }
        );
        fireEvent.click(getByText('Next'));
    });

    expect(getAllByText('Select associated control techniques')).toHaveLength(2);

    act(() => {
        fireEvent.click(getByText('Next'));
    });

    expect(getByText(fixtureCreateControlObjective.name)).toBeVisible();
    expect(getByText(fixtureCreateControlObjective.description!)).toBeVisible();
    expect(await findByText('Submit')).toBeVisible();
    fireEvent.click(getByText('Submit'));
};

export const controlObjUpdateFormNavigateAndAssert = async (
    renderResult: RenderResult
) => {
    const { getByText, getAllByRole, getAllByText, findByText, getByDisplayValue } =
        renderResult;
    expect(getByText('Update Control Objective')).toBeInTheDocument();
    expect(getAllByText('Control Objective Details').length).toBe(2);
    expect(getByDisplayValue('Test Control Objective')).toBeInTheDocument();
    expect(getByText('Description Test Control Objective')).toBeInTheDocument();
    act(() => {
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'name')[0],
            { target: { value: fixtureUpdateControlObjective.name } }
        );
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'description')[0],
            { target: { value: fixtureUpdateControlObjective.description } }
        );
        fireEvent.click(getByText('Next'));
    });

    expect(getAllByText('Select associated control techniques')).toHaveLength(2);

    act(() => {
        fireEvent.click(getByText('Next'));
    });

    expect(getByText(fixtureUpdateControlObjective.name)).toBeVisible();
    expect(getByText(fixtureUpdateControlObjective.description!)).toBeVisible();

    expect(await findByText('Submit')).toBeVisible();
    fireEvent.click(getByText('Submit'));
};

describe('ControlObjectiveForm', () => {
    test('render create', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const renderResult = render(
            <BrowserRouter>
                <ControlObjectiveForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isUpdate={false}
                    controlTechniques={fixtureListAllControlTechniques}
                />
            </BrowserRouter>
        );

        await controlObjCreateFormNavigateAndAssert(renderResult);

        expect(mockOnSubmit).toBeCalledWith(
            fixtureCreateControlObjective,
            expect.any(Object),
            expect.any(Function)
        );
    });

    test('render update', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const renderResult = render(
            <BrowserRouter>
                <ControlObjectiveForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isUpdate={true}
                    initialValues={fixtureControlObjectiveInitialValues}
                    controlTechniques={fixtureListAllControlTechniques}
                />
            </BrowserRouter>
        );

        await controlObjUpdateFormNavigateAndAssert(renderResult);

        expect(mockOnSubmit).toBeCalledWith(
            {
                ...fixtureControlObjectiveInitialValues,
                name: fixtureUpdateControlObjective.name,
                description: fixtureUpdateControlObjective.description,
            },
            expect.any(Object),
            expect.any(Function)
        );
    });
});
