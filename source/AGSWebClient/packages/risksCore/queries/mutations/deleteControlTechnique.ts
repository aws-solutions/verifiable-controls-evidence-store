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
import {
    DeleteControlTechniqueParams,
    DeleteControlTechniqueResponse,
} from '../../types';
import { QueryType } from '../../queries';

export class DeleteControlTechniqueMutation extends MutationBase<
    DeleteControlTechniqueParams,
    DeleteControlTechniqueResponse
> {
    createRequest(
        request: DeleteControlTechniqueParams
    ): AgsApiOptions<DeleteControlTechniqueParams> {
        return {
            serviceName: 'AGSRiskManagementService',
            pathTemplate: 'controltechniques/{id}',
            method: 'DELETE',
            pathParameters: { id: request.id },
        };
    }

    async onComplete(
        error: Error | null,
        data: DeleteControlTechniqueResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Delete Control Technique onError ' + error);
        } else if (data) {
            console.debug('Delete Control Technique onSuccess ' + JSON.stringify(data));
            // invalidate cache when succeed
            await this.queryClient.invalidateQueries([
                QueryType.GET_CONTROLTECHNIQUE,
                data.id,
            ]);
            await this.queryClient.invalidateQueries(QueryType.LIST_CONTROLTECHNIQUES);
            await this.queryClient.invalidateQueries(
                QueryType.LIST_ALL_CONTROLTECHNIQUES
            );
        }
    }
}
