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
import { CreateBusinessUnitParams, CreateBusinessUnitResponse } from '../../types';

export class CreateBusinessUnitMutation extends MutationBase<
    CreateBusinessUnitParams,
    CreateBusinessUnitResponse
> {
    createRequest(
        request: CreateBusinessUnitParams
    ): AgsApiOptions<CreateBusinessUnitParams> {
        return {
            serviceName: 'AGSRiskManagementService',
            pathTemplate: 'businessunits',
            method: 'POST',
            payload: {
                name: request.name,
                description: request.description,
                parentId: request.parentId,
                businessOwner: request.businessOwner,
                riskOwner: request.riskOwner,
                techOwner: request.techOwner,
            },
        };
    }

    async onComplete(
        error: Error | null,
        data: CreateBusinessUnitResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Create Business Unit onError ' + error);
        } else if (data) {
            console.debug('Create Business Unit onSuccess ' + JSON.stringify(data));
        }
    }
}
