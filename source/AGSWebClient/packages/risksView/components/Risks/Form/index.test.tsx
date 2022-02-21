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
import { ControlObjectiveSummary, RiskOptions } from '@ags/webclient-risks-core/types';
import RiskForm, { RiskFormData } from '.';
import { BrowserRouter } from 'react-router-dom';

export const fixtureCreateRiskValues: RiskFormData = {
    name: 'TestName',
    description: 'Test Description',
    category: 'GENERAL',
    severity: 'HIGH',
    likelihood: 'MODERATE',
    rating: 'LOW',
};

export const fixtureInitialValues: RiskFormData = {
    ...fixtureCreateRiskValues,
    controlObjectives: [
        {
            id: 'co-1',
        },
        {
            id: 'co-2',
        },
    ],
};

export const fixtureUpdateRiskValues: RiskFormData = {
    ...fixtureCreateRiskValues,
    name: 'Updated Test Name',
    description: 'Updated Test Description',
};

export const fixtureControlObjectives: ControlObjectiveSummary[] = [
    {
        id: 'co-1',
        name: 'Control Objective 1',
        description: 'Description of Control Objective 1',
    },
    {
        id: 'co-2',
        name: 'Control Objective 2',
        description: 'Description of Control Objective 2',
    },
];

export const fixtureRiskOptions: RiskOptions = {
    riskCategory: ['GENERAL', 'CYBERSECURITY'],
    riskSeverity: ['VERY_HIGH', 'HIGH', 'MODERATE', 'LOW', 'VERY_LOW'],
    riskLikelihood: ['VERY_HIGH', 'HIGH', 'MODERATE', 'LOW', 'VERY_LOW'],
    riskRating: ['VERY_HIGH', 'HIGH', 'MODERATE', 'LOW', 'VERY_LOW'],
};

export async function riskCreateFormNavigateAndAssert(renderResult: RenderResult) {
    const { getByText, getAllByRole, getAllByTestId, getAllByText, findByText } =
        renderResult;

    // Initial page
    expect(getByText('Create Risk')).toBeInTheDocument();
    expect(getAllByText('Risk Details').length).toBe(2);
    act(() => {
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'name')[0],
            { target: { value: fixtureCreateRiskValues.name } }
        );
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'description')[0],
            { target: { value: fixtureCreateRiskValues.description } }
        );
        fireEvent.change(getAllByTestId('select')[0].children[1], {
            target: { value: fixtureCreateRiskValues.category },
        });
        fireEvent.change(getAllByTestId('select')[1].children[1], {
            target: { value: fixtureCreateRiskValues.severity },
        });
        fireEvent.change(getAllByTestId('select')[2].children[1], {
            target: { value: fixtureCreateRiskValues.likelihood },
        });
        fireEvent.change(getAllByTestId('select')[3].children[1], {
            target: { value: fixtureCreateRiskValues.rating },
        });
        fireEvent.click(getByText('Next'));
    });

    // Select control objectives page
    expect(getAllByText('Select mitigation control objectives')).toHaveLength(2);

    act(() => {
        fireEvent.click(getByText('Next'));
    });

    // Review page
    expect(getByText(fixtureCreateRiskValues.name)).toBeVisible();
    expect(getByText(fixtureCreateRiskValues.description!)).toBeVisible();
    expect(getByText(fixtureCreateRiskValues.category!)).toBeVisible();
    expect(getByText(fixtureCreateRiskValues.severity!)).toBeVisible();
    expect(getByText(fixtureCreateRiskValues.likelihood!)).toBeVisible();
    expect(getByText(fixtureCreateRiskValues.rating!)).toBeVisible();
    expect(getByText('Control Objectives (0)')).toBeVisible();

    expect(await findByText('Submit')).toBeVisible();

    act(() => {
        fireEvent.click(getByText('Submit'));
    });
}

export async function riskUpdateFormNavigateAndAssert(renderResult: RenderResult) {
    const { getByText, getByDisplayValue, getAllByRole, getAllByText, findByText } =
        renderResult;

    expect(getByText('Update Risk')).toBeInTheDocument();
    expect(getAllByText('Risk Details').length).toBe(2);
    expect(getByDisplayValue(fixtureInitialValues.name)).toBeInTheDocument();
    expect(getByText(fixtureInitialValues.description!)).toBeInTheDocument();
    act(() => {
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'name')[0],
            { target: { value: fixtureUpdateRiskValues.name } }
        );
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'description')[0],
            { target: { value: fixtureUpdateRiskValues.description! } }
        );
        fireEvent.click(getByText('Next'));
    });

    expect(getAllByText('Select mitigation control objectives')).toHaveLength(2);

    act(() => {
        fireEvent.click(getByText('Next'));
    });

    expect(getByText(fixtureUpdateRiskValues.name)).toBeVisible();
    expect(getByText(fixtureUpdateRiskValues.description!)).toBeVisible();
    expect(getByText(fixtureInitialValues.category!)).toBeVisible();
    expect(getByText(fixtureInitialValues.severity!)).toBeVisible();
    expect(getByText(fixtureInitialValues.likelihood!)).toBeVisible();
    expect(getByText(fixtureInitialValues.rating!)).toBeVisible();

    expect(await findByText('Submit')).toBeVisible();

    act(() => {
        fireEvent.click(getByText('Submit'));
    });
}

describe('RiskForm', () => {
    test('render create', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const renderResult = render(
            <BrowserRouter>
                <RiskForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isUpdate={false}
                    controlObjectives={fixtureControlObjectives}
                    riskOptions={fixtureRiskOptions}
                />
            </BrowserRouter>
        );

        await riskCreateFormNavigateAndAssert(renderResult);

        expect(mockOnSubmit).toBeCalledWith(
            fixtureCreateRiskValues,
            expect.any(Object),
            expect.any(Function)
        );
    });

    test('render update', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const renderResult = render(
            <BrowserRouter>
                <RiskForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isUpdate={true}
                    initialValues={fixtureInitialValues}
                    controlObjectives={fixtureControlObjectives}
                    riskOptions={fixtureRiskOptions}
                />
            </BrowserRouter>
        );

        await riskUpdateFormNavigateAndAssert(renderResult);

        expect(mockOnSubmit).toBeCalledWith(
            {
                ...fixtureUpdateRiskValues,
                controlObjectives: fixtureInitialValues.controlObjectives,
            },
            expect.any(Object),
            expect.any(Function)
        );
    });
});
