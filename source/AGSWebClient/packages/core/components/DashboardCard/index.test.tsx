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
import DashboardCard from '@ags/webclient-core/components/DashboardCard';

describe('Dashboard Card', () => {
    test('render', () => {
        const title = 'Test title';
        const subTitle = 'Test Sub Title';
        const mockOnReset = jest.fn();
        const { getByRole, getByText } = render(
            <DashboardCard title={title} subtitle={subTitle} onResetClick={mockOnReset} />
        );
        expect(getByText(title)).toBeInTheDocument();
        expect(getByText(subTitle)).toBeInTheDocument();
        expect(getByRole('button')).toBeInTheDocument();

        act(() => {
            fireEvent.click(getByRole('button'));
        });
        expect(mockOnReset).toHaveBeenCalled();
    });
});
