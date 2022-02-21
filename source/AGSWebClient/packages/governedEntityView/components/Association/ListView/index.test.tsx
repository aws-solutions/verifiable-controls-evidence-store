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
import { render, act, fireEvent, waitFor } from '@testing-library/react';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import GovenedEntityListView from '.';

jest.mock('@ags/webclient-core/containers/AppContext');

const businessUnits: BusinessUnitSummary[] = [
    {
        id: 'bu-1',
        name: 'Business Unit 1',
        parentId: 'bu-0',
        unitType: 'BusinessUnit',
    },
    {
        id: 'bu-2',
        name: 'Business Unit 2',
        parentId: 'bu-0',
        unitType: 'BusinessUnit',
    },
    {
        id: 'bu-3',
        name: 'Business Unit 3',
        parentId: 'bu-0',
        unitType: 'BusinessUnit',
    },
];

const extraColumns = [
    {
        id: 'unitType',
        width: 500,
        Header: 'Unit Type',
        accessor: 'unitType',
    },
];

describe('GovenedEntityListView', () => {
    test('render', async () => {
        const mockOnEdit = jest.fn();

        const { getByText, getAllByText, getAllByRole } = render(
            <GovenedEntityListView
                onEditAssociation={mockOnEdit}
                entityName="Test Entity"
                extraColumns={extraColumns}
                useName={false}
                isLoading={false}
                data={businessUnits}
                isError={false}
                error={null}
            />
        );

        expect(getByText('Select a Test Entity to Manage')).toBeInTheDocument();
        expect(getByText('Business Unit 1')).toBeInTheDocument();
        expect(getByText('Business Unit 2')).toBeInTheDocument();
        expect(getByText('Business Unit 3')).toBeInTheDocument();
        expect(getAllByText('BusinessUnit').length).toBe(3);

        expect(getByText('Edit Association').parentElement).toBeDisabled();

        // three radio buttons for selection
        expect(getAllByRole('radio').length).toBe(3);

        // select a control objective
        await act(async () => {
            const radioButton = getAllByRole('radio')[1];
            radioButton.click();
        });

        await waitFor(() => {
            expect(getByText('Edit Association').parentElement).toBeEnabled();
        });

        // button
        fireEvent.click(getByText('Edit Association'));
        expect(mockOnEdit).toHaveBeenCalledWith('bu-2');
    });

    test('render with useName', async () => {
        const mockOnEdit = jest.fn();

        const { getByText, getAllByText, getAllByRole } = render(
            <GovenedEntityListView
                onEditAssociation={mockOnEdit}
                entityName="Test Entity"
                extraColumns={extraColumns}
                useName={true}
                isLoading={false}
                data={businessUnits}
                isError={false}
                error={null}
            />
        );

        expect(getByText('Select a Test Entity to Manage')).toBeInTheDocument();
        expect(getByText('Business Unit 1')).toBeInTheDocument();
        expect(getByText('Business Unit 2')).toBeInTheDocument();
        expect(getByText('Business Unit 3')).toBeInTheDocument();
        expect(getAllByText('BusinessUnit').length).toBe(3);

        expect(getByText('Edit Association').parentElement).toBeDisabled();

        // three radio buttons for selection
        expect(getAllByRole('radio').length).toBe(3);

        // select a control objective
        await act(async () => {
            const radioButton = getAllByRole('radio')[1];
            radioButton.click();
        });

        await waitFor(() => {
            expect(getByText('Edit Association').parentElement).toBeEnabled();
        });

        // button
        fireEvent.click(getByText('Edit Association'));
        expect(mockOnEdit).toHaveBeenCalledWith('Business Unit 2');
    });

    test('render without extra colums', async () => {
        const mockOnEdit = jest.fn();

        const { getByText, queryAllByText, getAllByRole } = render(
            <GovenedEntityListView
                onEditAssociation={mockOnEdit}
                entityName="Test Entity"
                isLoading={false}
                data={businessUnits}
                isError={false}
                error={null}
            />
        );

        expect(getByText('Select a Test Entity to Manage')).toBeInTheDocument();
        expect(getByText('Business Unit 1')).toBeInTheDocument();
        expect(getByText('Business Unit 2')).toBeInTheDocument();
        expect(getByText('Business Unit 3')).toBeInTheDocument();
        expect(queryAllByText('BusinessUnit').length).toBe(0);

        expect(getByText('Edit Association').parentElement).toBeDisabled();

        // three radio buttons for selection
        expect(getAllByRole('radio').length).toBe(3);

        // select a control objective
        await act(async () => {
            const radioButton = getAllByRole('radio')[1];
            radioButton.click();
        });

        await waitFor(() => {
            expect(getByText('Edit Association').parentElement).toBeEnabled();
        });

        // button
        fireEvent.click(getByText('Edit Association'));
        expect(mockOnEdit).toHaveBeenCalledWith('bu-2');
    });

    test('render with error', async () => {
        const mockOnEdit = jest.fn();

        const { getByText, queryByText } = render(
            <GovenedEntityListView
                onEditAssociation={mockOnEdit}
                entityName="Test Entity"
                isLoading={false}
                data={businessUnits}
                isError={true}
                error={new Error('Test Error Message')}
            />
        );

        expect(getByText('Test Error Message')).toBeInTheDocument();
        expect(queryByText('Select a Test Entity to Manage')).not.toBeInTheDocument();
        expect(queryByText('Business Unit 1')).not.toBeInTheDocument();
        expect(queryByText('Business Unit 2')).not.toBeInTheDocument();
        expect(queryByText('Business Unit 3')).not.toBeInTheDocument();
    });
});
