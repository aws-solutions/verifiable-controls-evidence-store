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
import ApplicationReview from '.';
import { BrowserRouter } from 'react-router-dom';
import { ApplicationFormData } from '../../types';

const appFormValues: ApplicationFormData = {
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

describe('ApplicationReview', () => {
    test('render create', async () => {
        // Application Review page
        const { getByText } = render(
            <BrowserRouter>
                <ApplicationReview data={appFormValues} />
            </BrowserRouter>
        );

        // Review page
        expect(getByText(appFormValues.name)).toBeInTheDocument();
        expect(getByText(appFormValues.description!)).toBeInTheDocument();
        expect(getByText(appFormValues.applicationOwner)).toBeInTheDocument();
        expect(getByText(appFormValues.estate.split(':')[0])).toBeInTheDocument();
        expect(getByText(appFormValues.environments[0].label)).toBeInTheDocument();
        expect(getByText(appFormValues.attributes[0].key)).toBeInTheDocument();
        expect(getByText(appFormValues.attributes[0].value)).toBeInTheDocument();
        expect(getByText(appFormValues.attributes[1].key)).toBeInTheDocument();
        expect(getByText(appFormValues.attributes[1].value)).toBeInTheDocument();
        expect(getByText(appFormValues.metadata![0].key)).toBeInTheDocument();
        expect(getByText(appFormValues.metadata![0].value)).toBeInTheDocument();
    }, 20000);
});
