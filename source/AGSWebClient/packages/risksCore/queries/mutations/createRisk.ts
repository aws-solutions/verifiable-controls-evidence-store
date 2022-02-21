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

import { AgsApiOptions, MutationBase } from '@ags/webclient-core/queries';
import { CreateRiskParams, CreateRiskResponse } from '../../types';

export class CreateRiskMutation extends MutationBase<
    CreateRiskParams,
    CreateRiskResponse
> {
    createRequest(request: CreateRiskParams): AgsApiOptions<CreateRiskParams> {
        return {
            serviceName: 'AGSRiskManagementService',
            pathTemplate: 'risks',
            method: 'POST',
            payload: {
                name: request.name,
                description: request.description,
                category: request.category,
                severity: request.severity,
                likelihood: request.likelihood,
                rating: request.rating,
                controlObjectiveIds: request.controlObjectiveIds,
            },
        };
    }

    async onComplete(
        error: Error | null,
        data: CreateRiskResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Create Risk onError ' + error);
        } else if (data) {
            console.debug('Create Risk onSuccess ' + JSON.stringify(data));
        }
    }
}
