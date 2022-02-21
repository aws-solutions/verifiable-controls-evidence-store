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
import { DeleteRiskParams, DeleteRiskResponse } from '../../types';
import { QueryType } from '../../queries';

export class DeleteRiskMutation extends MutationBase<
    DeleteRiskParams,
    DeleteRiskResponse
> {
    createRequest(request: DeleteRiskParams): AgsApiOptions<DeleteRiskParams> {
        return {
            serviceName: 'AGSRiskManagementService',
            pathTemplate: 'risks/{id}',
            method: 'DELETE',
            pathParameters: { id: request.id },
        };
    }

    async onComplete(
        error: Error | null,
        data: DeleteRiskResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Delete Control Risk onError ' + error);
        } else if (data) {
            console.debug('Delete Control Risk onSuccess ' + JSON.stringify(data));
            // invalidate cache when succeed
            await this.queryClient.invalidateQueries([QueryType.GET_RISK, data.id]);
            await this.queryClient.invalidateQueries([QueryType.LIST_RISKS]);
            await this.queryClient.prefetchQuery([QueryType.LIST_RISKS]);
        }
    }
}
