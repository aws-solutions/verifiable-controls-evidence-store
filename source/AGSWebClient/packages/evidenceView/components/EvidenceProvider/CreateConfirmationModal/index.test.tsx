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
import { act, fireEvent, render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateConfirmationModal from '.';

describe('Evidence provider create modal dialog tests', () => {
    test('render test', () => {
        const mockOnDismiss = jest.fn();
        const mockOnSetVisible = jest.fn();
        const provider = {
            evidenceProviderName: 'test provider',
            evidenceProviderId: 'my-id',
            apiKey: '12345',
        };

        const { getByText } = render(
            <BrowserRouter>
                <CreateConfirmationModal
                    onDismissed={mockOnDismiss}
                    setVisible={mockOnSetVisible}
                    visible={true}
                    evidenceProvider={provider}
                ></CreateConfirmationModal>
            </BrowserRouter>
        );

        expect(getByText('Evidence Provider Name')).toBeInTheDocument();
        expect(getByText('Evidence Provider Id')).toBeInTheDocument();
        expect(getByText('API Key')).toBeInTheDocument();

        act(() => {
            fireEvent.click(getByText('OK'));
        });

        expect(mockOnDismiss).toBeCalled();
    });
});
