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
import { UpdateRiskParams, UpdateRiskResponse } from '../../types';

export class UpdateRiskMutation extends MutationBase<
    UpdateRiskParams,
    UpdateRiskResponse
> {
    createRequest(request: UpdateRiskParams): AgsApiOptions<UpdateRiskParams> {
        return {
            serviceName: 'AGSRiskManagementService',
            pathTemplate: 'risks/{id}',
            method: 'PUT',
            pathParameters: { id: request.id },
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
        data: UpdateRiskResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Create Control Risk onError ' + error);
        } else if (data) {
            console.debug('Create Control Risk onSuccess ' + JSON.stringify(data));
        }
    }
}
