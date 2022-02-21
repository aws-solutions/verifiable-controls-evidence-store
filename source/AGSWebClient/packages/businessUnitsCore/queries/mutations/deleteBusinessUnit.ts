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
import { DeleteBusinessUnitParams, DeleteBusinessUnitResponse } from '../../types';
import { QueryType } from '../types';

export class DeleteBusinessUnitMutation extends MutationBase<
    DeleteBusinessUnitParams,
    DeleteBusinessUnitResponse
> {
    createRequest(
        request: DeleteBusinessUnitParams
    ): AgsApiOptions<DeleteBusinessUnitParams> {
        return {
            serviceName: 'AGSRiskManagementService',
            pathTemplate: 'businessunits/{id}',
            method: 'DELETE',
            pathParameters: { id: request.id },
        };
    }

    async onComplete(
        error: Error | null,
        data: DeleteBusinessUnitResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Delete Business Unit onError ' + error);
        } else if (data) {
            console.debug('Delete Business Unit onSuccess ' + JSON.stringify(data));
            // invalidate cache when succeed
            await this.queryClient.invalidateQueries(QueryType.LIST_BUSINESSUNITS);
        }
    }
}
