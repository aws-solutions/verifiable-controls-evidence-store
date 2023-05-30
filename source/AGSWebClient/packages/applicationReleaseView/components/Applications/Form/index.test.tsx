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
import { RenderResult, act, fireEvent, render, within } from '@testing-library/react';

import ApplicationForm from '.';
import { ApplicationFormData } from './types';
import { BrowserRouter } from 'react-router-dom';
import { Estate } from '@ags/webclient-application-release-core/types';

export const fixtureListEstatesData: Estate[] = [
    {
        id: 'est-1111111',
        name: 'test_estate',
        environments: [
            {
                awsAccountId: '111122223333',
                estateId: 'est-1111111',
                name: 'env1',
                isManualApprovalRequired: false,
                id: 'env-11111111',
                envClasses: ['nonprod'],
                mandatory: true,
            },
            {
                awsAccountId: '555555555555',
                estateId: 'est-1111111',
                name: 'env2',
                isManualApprovalRequired: false,
                id: 'env-22222222',
                envClasses: ['prod'],
                mandatory: false,
            },
        ],
    },
];

export const fixtureListAttributesData = {
    dataClassification: [
        {
            name: 'dataClassification:group',
            description: 'dataClassification',
            key: 'dataClassification',
            value: 'group',
            metadata: {
                key1: 'value1',
            },
            createTime: '2021-11-17T06:01:51.389Z',
            lastUpdateTime: '2021-11-17T06:01:51.389Z',
            isMandatory: true,
        },
        {
            name: 'dataClassification:confidential',
            description: 'dataClassification',
            key: 'dataClassification',
            value: 'confidential',
            metadata: {
                key1: 'value1',
            },
            createTime: '2021-11-17T06:01:59.024Z',
            lastUpdateTime: '2021-11-17T06:01:59.024Z',
            isMandatory: true,
        },
    ],
    hostingConstruct: [
        {
            name: 'hostingConstruct:lambda',
            description: 'hostingConstruct',
            key: 'hostingConstruct',
            value: 'lambda',
            metadata: {
                key1: 'value1',
            },
            createTime: '2021-11-17T06:02:15.035Z',
            lastUpdateTime: '2021-11-17T06:02:15.035Z',
            isMandatory: true,
        },
        {
            name: 'hostingConstruct:ec2',
            description: 'hostingConstruct',
            key: 'hostingConstruct',
            value: 'ec2',
            metadata: {
                key1: 'value1',
            },
            createTime: '2021-11-17T06:02:19.232Z',
            lastUpdateTime: '2021-11-17T06:02:19.232Z',
            isMandatory: true,
        },
    ],
    testAttribute: [
        {
            name: 'testAttribute:testAttrValue',
            description: 'testAttribute',
            key: 'testAttribute',
            value: 'testAttrValue',
            metadata: {
                key1: 'value1',
            },
            createTime: '2021-11-17T06:02:52.748Z',
            lastUpdateTime: '2021-11-17T06:02:52.748Z',
            isMandatory: false,
        },
    ],
};

const fixtureInitialFormValues: ApplicationFormData = {
    name: '',
    applicationOwner: '',
    estate: '',
    environments: [],
    attributes: [
        {
            key: 'dataClassification',
            value: '',
        },
        {
            key: 'hostingConstruct',
            value: '',
        },
    ],
};

export const fixtureCreateAppFormValues: ApplicationFormData = {
    name: 'TestApplication',
    applicationOwner: 'Test Application Owner',
    description: 'Test Description',
    estate: 'test_estate:est-1111111',
    environments: [
        {
            label: 'env1',
            value: 'env-11111111',
        },
    ],
    attributes: [
        {
            key: 'dataClassification',
            value: 'group',
        },
        {
            key: 'hostingConstruct',
            value: 'lambda',
        },
    ],
    metadata: [
        {
            key: 'test-metadata-key',
            value: 'test-metadata-value',
        },
    ],
};

export const fixtureUpdateAppFormValues: ApplicationFormData = {
    ...fixtureCreateAppFormValues,
    description: 'Updated Test Description',
    attributes: [
        {
            key: 'dataClassification',
            value: 'confidential',
        },
        {
            key: 'hostingConstruct',
            value: 'lambda',
        },
    ],
    metadata: [
        {
            key: 'test-metadata-key-new',
            value: 'test-metadata-value-new',
        },
    ],
};
export const appCreateFormNavigateAndAssert = async (renderResult: RenderResult) => {
    const {
        getAllByRole,
        getByDisplayValue,
        getByLabelText,
        getByText,
        getAllByText,
        getAllByTestId,
        findAllByRole,
        findByRole,
    } = renderResult;

    expect(getByText('Create Application')).toBeInTheDocument();
    expect(getByText('Name')).toBeInTheDocument();
    expect(getByText('Description')).toBeInTheDocument();
    expect(getByText('Application Owner')).toBeInTheDocument();
    expect(getByText('Estate')).toBeInTheDocument();
    expect(
        getByText('Environments (To be selected in the order of deployment)')
    ).toBeInTheDocument();

    await act(async () => {
        fireEvent.change(getByLabelText('Name'), {
            target: { value: fixtureCreateAppFormValues.name },
        });
        fireEvent.change(getByLabelText('Description'), {
            target: { value: fixtureCreateAppFormValues.description },
        });
        fireEvent.change(getByLabelText('Application Owner'), {
            target: { value: fixtureCreateAppFormValues.applicationOwner },
        });
        fireEvent.change(getAllByTestId('select')[0].children[1], {
            target: { value: fixtureCreateAppFormValues.estate },
        });
        fireEvent.mouseDown(
            getAllByTestId('multiselect')[0].children[0].children[0].children[1]
        );
        const listbox = within(await findByRole('listbox'));
        fireEvent.click(
            listbox.getByText(fixtureCreateAppFormValues.environments[0].label)
        );
        fireEvent.click(getByText('Next'));
    });
    // Select Attribute page
    expect(getByText('Add new item')).toBeVisible();
    expect(getAllByText('Select Attribute')).toHaveLength(2);
    expect(getByDisplayValue('dataClassification')).toBeInTheDocument();
    expect(getByDisplayValue('hostingConstruct')).toBeInTheDocument();

    act(() => {
        fireEvent.change(getAllByTestId('select')[1].children[1], {
            target: { value: fixtureCreateAppFormValues.attributes[0].value },
        });
        fireEvent.change(getAllByTestId('select')[3].children[1], {
            target: { value: fixtureCreateAppFormValues.attributes[1].value },
        });
        fireEvent.click(getByText('Next'));
    });

    // Application Metadata page
    expect(getByText('Add new item')).toBeVisible();
    expect(getAllByText('Application Metadata')).toHaveLength(2);

    await act(async () => {
        fireEvent.click(getByText('Add new item'));
        fireEvent.change(
            (await findAllByRole('textbox')).filter(
                (element) => element.id === 'metadata[0].key'
            )[0],
            { target: { value: fixtureCreateAppFormValues.metadata![0].key } }
        );
        fireEvent.change(
            getAllByRole('textbox').filter(
                (element) => element.id === 'metadata[0].value'
            )[0],
            { target: { value: fixtureCreateAppFormValues.metadata![0].value } }
        );
        fireEvent.click(getByText('Next'));
    });

    // Review page
    expect(getByText(fixtureCreateAppFormValues.name)).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.description!)).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.applicationOwner)).toBeInTheDocument();
    expect(
        getByText(fixtureCreateAppFormValues.estate.split(':')[0])
    ).toBeInTheDocument();
    expect(
        getByText(fixtureCreateAppFormValues.environments[0].label)
    ).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.attributes[0].key)).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.attributes[0].value)).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.attributes[1].key)).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.attributes[1].value)).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.metadata![0].key)).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.metadata![0].value)).toBeInTheDocument();
    expect(getByText('Submit')).toBeInTheDocument();

    act(() => {
        fireEvent.click(getByText('Submit'));
    });
};

export const appUpdateFormNavigateAndAssert = async (renderResult: RenderResult) => {
    const {
        getAllByRole,
        getByDisplayValue,
        getByLabelText,
        getByText,
        getAllByText,
        findAllByRole,
        findAllByTestId,
    } = renderResult;

    expect(getByText('Update Application')).toBeInTheDocument();
    expect(getByDisplayValue(fixtureCreateAppFormValues.name)).toBeInTheDocument();
    expect(
        getByDisplayValue(fixtureCreateAppFormValues.description!)
    ).toBeInTheDocument();
    expect(
        getByDisplayValue(fixtureCreateAppFormValues.applicationOwner)
    ).toBeInTheDocument();
    expect(
        getByText(fixtureCreateAppFormValues.estate.split(':')[0])
    ).toBeInTheDocument();
    expect(
        getByText(fixtureCreateAppFormValues.environments[0].label)
    ).toBeInTheDocument();

    act(() => {
        fireEvent.change(getByLabelText('Description'), {
            target: { value: fixtureUpdateAppFormValues.description },
        });
        fireEvent.click(getByText('Next'));
    });

    // Select Attribute page
    expect(getByText('Add new item')).toBeVisible();
    expect(getAllByText('Select Attribute')).toHaveLength(2);
    expect(
        getByDisplayValue(fixtureCreateAppFormValues.attributes[0].key)
    ).toBeInTheDocument();
    expect(
        getByDisplayValue(fixtureCreateAppFormValues.attributes[0].value)
    ).toBeInTheDocument();
    expect(
        getByDisplayValue(fixtureCreateAppFormValues.attributes[1].key)
    ).toBeInTheDocument();
    expect(
        getByDisplayValue(fixtureCreateAppFormValues.attributes[1].value)
    ).toBeInTheDocument();

    await act(async () => {
        fireEvent.change((await findAllByTestId('select'))[1].children[1], {
            target: { value: fixtureUpdateAppFormValues.attributes[0].value },
        });
        fireEvent.click(getByText('Next'));
    });

    // Application Metadata page
    expect(getByText('Add new item')).toBeVisible();
    expect(getAllByText('Application Metadata')).toHaveLength(2);
    expect(
        getByDisplayValue(fixtureCreateAppFormValues.metadata![0].key)
    ).toBeInTheDocument();
    expect(
        getByDisplayValue(fixtureCreateAppFormValues.metadata![0].value)
    ).toBeInTheDocument();

    await act(async () => {
        fireEvent.change(
            (await findAllByRole('textbox')).filter(
                (element) => element.id === 'metadata[0].key'
            )[0],
            { target: { value: fixtureUpdateAppFormValues.metadata![0].key } }
        );
        fireEvent.change(
            getAllByRole('textbox').filter(
                (element) => element.id === 'metadata[0].value'
            )[0],
            { target: { value: fixtureUpdateAppFormValues.metadata![0].value } }
        );
        fireEvent.click(getByText('Next'));
    });

    // Review page
    expect(getByText(fixtureCreateAppFormValues.name)).toBeInTheDocument();
    expect(
        getByText(fixtureUpdateAppFormValues.description as string)
    ).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.applicationOwner)).toBeInTheDocument();
    expect(
        getByText(fixtureCreateAppFormValues.estate.split(':')[0])
    ).toBeInTheDocument();
    expect(
        getByText(fixtureCreateAppFormValues.environments[0].label)
    ).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.attributes[0].key)).toBeInTheDocument();
    expect(getByText(fixtureUpdateAppFormValues.attributes[0].value)).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.attributes[1].key)).toBeInTheDocument();
    expect(getByText(fixtureCreateAppFormValues.attributes[1].value)).toBeInTheDocument();
    expect(getByText(fixtureUpdateAppFormValues.metadata![0].key)).toBeInTheDocument();
    expect(getByText(fixtureUpdateAppFormValues.metadata![0].key)).toBeInTheDocument();
    expect(getByText('Submit')).toBeInTheDocument();

    act(() => {
        fireEvent.click(getByText('Submit'));
    });
};

describe('ApplicationForm', () => {
    test('render create', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const renderResult = render(
            <BrowserRouter>
                <ApplicationForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isUpdate={false}
                    estates={fixtureListEstatesData}
                    attributes={fixtureListAttributesData}
                    initialValues={fixtureInitialFormValues}
                />
            </BrowserRouter>
        );

        await appCreateFormNavigateAndAssert(renderResult);
        expect(mockOnSubmit).toHaveBeenCalledWith(
            fixtureCreateAppFormValues,
            expect.any(Object),
            expect.any(Function)
        );
    }, 20000);

    test('render update', async () => {
        const mockOnSubmit = jest.fn();
        const mockOnCancel = jest.fn();

        const renderResult = render(
            <BrowserRouter>
                <ApplicationForm
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                    isUpdate={true}
                    estates={fixtureListEstatesData}
                    attributes={fixtureListAttributesData}
                    initialValues={fixtureCreateAppFormValues}
                />
            </BrowserRouter>
        );
        await appUpdateFormNavigateAndAssert(renderResult);
        expect(mockOnSubmit).toBeCalledWith(
            fixtureUpdateAppFormValues,
            expect.any(Object),
            expect.any(Function)
        );
    }, 20000);
});
