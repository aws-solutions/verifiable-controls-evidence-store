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
import { AGS_SERVICES_APPLICATION_DEFINITION_SERVICE } from '../../config/constants';
import { UpdateApplicationParams, UpdateApplicationResponse } from '../../types';

export class UpdateApplicationMutation extends MutationBase<
    UpdateApplicationParams,
    UpdateApplicationResponse
> {
    createRequest(
        request: UpdateApplicationParams
    ): AgsApiOptions<UpdateApplicationParams> {
        return {
            serviceName: AGS_SERVICES_APPLICATION_DEFINITION_SERVICE,
            pathTemplate: 'applications/{id}',
            method: 'PUT',
            pathParameters: { id: request.name },
            payload: request,
        };
    }

    async onComplete(
        error: Error | null,
        data: UpdateApplicationResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Create Application onError ' + error);
        } else if (data) {
            console.debug('Create Application onSuccess ' + JSON.stringify(data));
        }
    }
}
