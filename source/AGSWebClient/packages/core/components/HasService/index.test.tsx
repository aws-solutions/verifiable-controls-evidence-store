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
import { render } from '@testing-library/react';
import HasService from '@ags/webclient-core/components/HasService';

jest.mock('@ags/webclient-core/containers/AppContext', () => ({
    useGovSuiteAppApi: () => ({
        apiEndpoints: {
            ServiceA: 'endpointA',
            ServiceB: 'endpointB',
        },
    }),
}));

describe('Has Service', () => {
    test('service A exists', () => {
        const { getByText } = render(
            <HasService service="ServiceA">Test Text</HasService>
        );
        expect(getByText('Test Text')).toBeInTheDocument();
    });

    test('service B exists', () => {
        const { getByText } = render(
            <HasService service="ServiceB">Test Text</HasService>
        );
        expect(getByText('Test Text')).toBeInTheDocument();
    });

    test('service not exist', () => {
        const { queryByText } = render(
            <HasService service="ServiceC">Test Text</HasService>
        );
        expect(queryByText('Test Text')).not.toBeInTheDocument();
    });
});
