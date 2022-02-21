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

import { FunctionComponent } from 'react';
import { useGovSuiteAppApi } from '../../containers/AppContext';

export interface HasServiceProps {
    service: string;
    children: any;
}

/**
 * Usage:
 * <HasService service={<name of service>}>Things to Render</HasGroups>
 *
 * @param service name of service to check.
 * @param children elements to render if the service is available.
 * @constructor
 */
const HasService: FunctionComponent<HasServiceProps> = ({ service, children }) => {
    const { apiEndpoints = [] } = useGovSuiteAppApi();
    const availableServices = Object.keys(apiEndpoints);
    return availableServices.includes(service) ? <>{children}</> : null;
};

export default HasService;
