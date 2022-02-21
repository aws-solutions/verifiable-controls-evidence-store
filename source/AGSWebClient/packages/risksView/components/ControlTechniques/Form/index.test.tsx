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
import { BrowserRouter } from 'react-router-dom';
import ControlTechniqueForm, { ControlTechniqueFormData } from '.';

export const fixtureCreateControlTechniqueRestType: ControlTechniqueFormData = {
    name: 'Test Control Technique',
    description: 'Description Test Control Technique',
    controlType: 'DETECTIVE',
    techniqueDetails: {
        integrationType: 'REST',
        policyId: 'policy-12345',
        bundleName: 'policyundle',
        namespace: 'namespace',
        restEndpoint: 'https://xyz.com',
    },
};

export const fixtureInitialFormValues: ControlTechniqueFormData = {
    ...fixtureCreateControlTechniqueRestType,
    enabled: true,
    status: 'ACTIVE',
};

export const fixtureUpdateControlTechniqueRestType: ControlTechniqueFormData = {
    ...fixtureCreateControlTechniqueRestType,
    name: 'Updated Test Control Technique',
    description: 'Updated Description Test Control Technique',
    controlType: 'CORRECTIVE',
};

export const controlTechniqueUpdateFormNavigateAndAssert = async (
    renderResult: RenderResult
) => {
    const {
        getByText,
        getAllByRole,
        getAllByTestId,
        getAllByText,
        findByText,
        getByDisplayValue,
    } = renderResult;

    expect(getByText('Update Control Technique')).toBeInTheDocument();
    expect(getAllByText('Control Technique Details').length).toBe(2);
    expect(
        getByDisplayValue(fixtureCreateControlTechniqueRestType.name!)
    ).toBeInTheDocument();
    expect(
        getByText(fixtureCreateControlTechniqueRestType.description!)
    ).toBeInTheDocument();

    expect(getByText(/DETECTIVE/i)).toBeInTheDocument();

    act(() => {
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'name')[0],
            { target: { value: fixtureUpdateControlTechniqueRestType.name } }
        );
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'description')[0],
            { target: { value: fixtureUpdateControlTechniqueRestType.description } }
        );
        fireEvent.change(getAllByTestId('select')[0].children[1], {
            target: { value: fixtureUpdateControlTechniqueRestType.controlType },
        });
        fireEvent.click(getByText('Next'));
    });

    expect(
        getByDisplayValue(
            fixtureCreateControlTechniqueRestType.techniqueDetails?.policyId!
        )
    ).toBeInTheDocument();

    act(() => {
        fireEvent.click(getByText('Next'));
    });

    expect(getByText('REST API')).toBeInTheDocument();
    expect(
        getByDisplayValue(
            fixtureCreateControlTechniqueRestType.techniqueDetails?.restEndpoint!
        )
    ).toBeInTheDocument();

    act(() => {
        fireEvent.click(getByText('Next'));
    });

    expect(getByText(fixtureUpdateControlTechniqueRestType.name!)).toBeVisible();
    expect(getByText(fixtureUpdateControlTechniqueRestType.description!)).toBeVisible();
    expect(getByText(fixtureUpdateControlTechniqueRestType.controlType!)).toBeVisible();
    expect(
        getByText(fixtureCreateControlTechniqueRestType.techniqueDetails?.policyId!)
    ).toBeVisible();
    expect(getByText('Integration (REST)')).toBeVisible();
    expect(
        getByText(fixtureCreateControlTechniqueRestType.techniqueDetails?.restEndpoint!)
    ).toBeVisible();

    expect(await findByText('Submit')).toBeVisible();

    act(() => {
        fireEvent.click(getByText('Submit'));
    });
};

export const controlTechniqueCreateFormNavigateAndAssert = async (
    renderResult: RenderResult
) => {
    const { getByText, getAllByTestId, getAllByRole, getAllByText, findByText } =
        renderResult;
    expect(getByText('Create Control Technique')).toBeInTheDocument();

    // Control technique details page
    expect(getAllByText('Control Technique Details').length).toBe(2);
    act(() => {
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'name')[0],
            { target: { value: fixtureCreateControlTechniqueRestType.name } }
        );
        fireEvent.change(
            getAllByRole('textbox').filter((element) => element.id === 'description')[0],
            { target: { value: fixtureCreateControlTechniqueRestType.description } }
        );
        fireEvent.change(getAllByTestId('select')[0].children[1], {
            target: { value: fixtureCreateControlTechniqueRestType.controlType },
        });
        fireEvent.change(
            getAllByRole('checkbox').filter((element) => element.id === 'enabled')[0],
            { target: { checked: true } }
        );
        fireEvent.click(getByText('Next'));
    });

    // Policy settings page
    expect(await findByText('Policy ID')).toBeVisible();

    act(() => {
        fireEvent.change(
            getAllByRole('textbox').filter(
                (element) => element.id === 'techniqueDetails.policyId'
            )[0],
            {
                target: {
                    value: fixtureCreateControlTechniqueRestType.techniqueDetails
                        ?.policyId,
                },
            }
        );
        fireEvent.change(
            getAllByRole('textbox').filter(
                (element) => element.id === 'techniqueDetails.bundleName'
            )[0],
            {
                target: {
                    value: fixtureCreateControlTechniqueRestType.techniqueDetails
                        ?.bundleName,
                },
            }
        );
        fireEvent.change(
            getAllByRole('textbox').filter(
                (element) => element.id === 'techniqueDetails.namespace'
            )[0],
            {
                target: {
                    value: fixtureCreateControlTechniqueRestType.techniqueDetails
                        ?.namespace,
                },
            }
        );
    });

    act(() => {
        fireEvent.click(getByText('Next'));
    });

    // Control integration page
    expect(await findByText('Integration Type')).toBeVisible();

    act(() => {
        fireEvent.change(getAllByTestId('select')[0].children[1], {
            target: {
                value: fixtureCreateControlTechniqueRestType.techniqueDetails
                    ?.integrationType,
            },
        });
    });

    expect(await findByText('REST Endpoint')).toBeVisible();

    act(() => {
        fireEvent.change(
            getAllByRole('textbox').filter(
                (element) => element.id === 'techniqueDetails.restEndpoint'
            )[0],
            {
                target: {
                    value: fixtureCreateControlTechniqueRestType.techniqueDetails
                        ?.restEndpoint,
                },
            }
        );

        fireEvent.click(getByText('Next'));
    });

    // Review page
    expect(getByText(fixtureCreateControlTechniqueRestType.name!)).toBeVisible();
    expect(getByText(fixtureCreateControlTechniqueRestType.description!)).toBeVisible();
    expect(getByText(fixtureCreateControlTechniqueRestType.controlType!)).toBeVisible();
    expect(
        getByText(fixtureCreateControlTechniqueRestType.techniqueDetails?.policyId!)
    ).toBeVisible();
    expect(
        getByText(fixtureCreateControlTechniqueRestType.techniqueDetails?.bundleName!)
    ).toBeVisible();
    expect(
        getByText(fixtureCreateControlTechniqueRestType.techniqueDetails?.namespace!)
    ).toBeVisible();
    expect(getByText('Integration (REST)')).toBeVisible();
    expect(
        getByText(fixtureCreateControlTechniqueRestType.techniqueDetails?.restEndpoint!)
    ).toBeVisible();

    act(() => {
        fireEvent.click(getByText('Submit'));
    });
};

describe('ControlTechniqueForm', () => {
    test('render create', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const renderResult = render(
            <BrowserRouter>
                <ControlTechniqueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            </BrowserRouter>
        );

        await controlTechniqueCreateFormNavigateAndAssert(renderResult);

        expect(mockOnSubmit).toBeCalledWith(
            fixtureCreateControlTechniqueRestType,
            expect.any(Object),
            expect.any(Function)
        );
    });

    test('render create for AWS CONFIG control', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const { getByText, getAllByTestId, getAllByRole, findByText } = render(
            <BrowserRouter>
                <ControlTechniqueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
            </BrowserRouter>
        );

        act(() => {
            fireEvent.change(
                getAllByRole('textbox').filter((element) => element.id === 'name')[0],
                { target: { value: 'Test Name' } }
            );
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'description'
                )[0],
                { target: { value: 'Test Description' } }
            );
            fireEvent.change(getAllByTestId('select')[0].children[1], {
                target: { value: 'DETECTIVE' },
            });
            fireEvent.change(
                getAllByRole('checkbox').filter((element) => element.id === 'enabled')[0],
                { target: { checked: true } }
            );
            fireEvent.click(getByText('Next'));
        });

        act(() => {
            fireEvent.click(getByText('Next'));
        });

        expect(await findByText('Integration Type')).toBeVisible();

        act(() => {
            fireEvent.change(getAllByTestId('select')[0].children[1], {
                target: { value: 'AWS_CONFIG' },
            });
        });

        expect(await findByText('Conformance Pack File URL')).toBeVisible();

        act(() => {
            fireEvent.change(
                getAllByRole('textbox').filter(
                    (element) => element.id === 'techniqueDetails.cpSourceUrls'
                )[0],
                { target: { value: 'https://xyz.com' } }
            );

            fireEvent.click(getByText('Next'));
        });

        expect(getByText('Test Name')).toBeVisible();
        expect(getByText('Test Description')).toBeVisible();
        expect(getByText('DETECTIVE')).toBeVisible();
        expect(getByText('Integration (AWS_CONFIG)')).toBeVisible();
        expect(getByText('https://xyz.com')).toBeVisible();

        act(() => {
            fireEvent.click(getByText('Submit'));
        });

        expect(mockOnSubmit).toBeCalledWith(
            {
                controlType: 'DETECTIVE',
                description: 'Test Description',
                name: 'Test Name',
                techniqueDetails: {
                    integrationType: 'AWS_CONFIG',
                    cpSourceUrls: 'https://xyz.com',
                },
            },
            expect.any(Object),
            expect.any(Function)
        );
    });

    test('render update', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const renderResult = render(
            <BrowserRouter>
                <ControlTechniqueForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isUpdate={true}
                    initialValues={fixtureInitialFormValues}
                />
            </BrowserRouter>
        );

        await controlTechniqueUpdateFormNavigateAndAssert(renderResult);

        expect(mockOnSubmit).toBeCalledWith(
            {
                ...fixtureUpdateControlTechniqueRestType,
                enabled: true,
                status: 'ACTIVE',
            },
            expect.any(Object),
            expect.any(Function)
        );
    });
});
