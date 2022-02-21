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
import { DeleteApplicationParams, DeleteApplicationResponse } from '../../types';
import { QueryType } from '../../queries';
import { AGS_SERVICES_APPLICATION_DEFINITION_SERVICE } from '../../config/constants';

export class DeleteApplicationMutation extends MutationBase<
    DeleteApplicationParams,
    DeleteApplicationResponse
> {
    createRequest(
        request: DeleteApplicationParams
    ): AgsApiOptions<DeleteApplicationParams> {
        return {
            serviceName: AGS_SERVICES_APPLICATION_DEFINITION_SERVICE,
            pathTemplate: 'applications/{id}',
            method: 'DELETE',
            pathParameters: { id: request.name },
            queryParams: { forceDelete: request.forceDelete },
        };
    }

    async onComplete(
        error: Error | null,
        data: DeleteApplicationResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Delete Application onError ' + error);
        } else if (data) {
            console.debug('Delete Application onSuccess ' + JSON.stringify(data));
            // invalidate cache when succeed
            await this.queryClient.invalidateQueries([
                QueryType.GET_APPLICATION,
                data.name,
            ]);
            await this.queryClient.invalidateQueries(QueryType.LIST_APPLICATIONS);
            await this.queryClient.invalidateQueries(QueryType.LIST_ALL_APPLICATIONS);
        }
    }
}
