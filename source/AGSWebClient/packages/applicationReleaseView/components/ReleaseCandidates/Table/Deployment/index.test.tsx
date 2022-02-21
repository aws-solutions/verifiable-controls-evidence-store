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
import DeploymentTable from '.';
import { BrowserRouter } from 'react-router-dom';

const deployments = [
    {
        deploymentId: 'deploy1',
        environmentId: 'env1',
        state: 'Successful',
    },
    {
        deploymentId: 'deploy2',
        environmentId: 'env2',
        state: '',
    },
];

describe('DeploymentTable', () => {
    test('render table', async () => {
        const { getByText, getAllByText } = render(
            <BrowserRouter>
                <DeploymentTable deployments={deployments} />
            </BrowserRouter>
        );

        expect(getByText('deploy1')).toBeInTheDocument();
        expect(getByText('deploy2')).toBeInTheDocument();
        expect(getByText('env1')).toBeInTheDocument();
        expect(getByText('env2')).toBeInTheDocument();
        expect(getAllByText('Successful').length).toBe(2);
        expect(getAllByText('Unknown').length).toBe(2);
    }, 20000);
});
