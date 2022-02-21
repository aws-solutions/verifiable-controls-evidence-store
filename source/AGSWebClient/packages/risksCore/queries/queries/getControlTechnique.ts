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
import { QueryBase, AgsApiOptions } from '@ags/webclient-core/queries';
import { ControlTechnique } from '../../types';

export class GetControlTechnique extends QueryBase<ControlTechnique> {
    createRequest(queryKey: string[]): AgsApiOptions {
        return {
            serviceName: 'AGSRiskManagementService',
            pathTemplate: 'controltechniques/{id}',
            method: 'GET',
            pathParameters: { id: queryKey[1] },
        };
    }
}
