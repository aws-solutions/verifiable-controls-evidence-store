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
import { render, waitFor } from '@testing-library/react';
import HelmetSettings from './index';

jest.mock('../../containers/AppContext', () => ({
    useGovSuiteAppApi: () => ({
        apiEndpoints: {
            AGSEvidenceStoreService: 'https://test',
        },
    }),
}));

describe('get started', () => {
    test('render with given title', async () => {
        render(<HelmetSettings pageHtmlTitle="ABC" />);
        await waitFor(() => expect(document.title).toEqual('ABC'));
    });

    test('render with automatic title', async () => {
        render(<HelmetSettings />);
        await waitFor(() => expect(document.title).toEqual('AWS Governance Suite'));
    });
});
