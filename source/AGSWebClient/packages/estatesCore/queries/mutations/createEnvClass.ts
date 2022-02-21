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
import { CreateEnvClassParams, CreateEnvClassResponse } from '../../types';

export class CreateEnvClassMutation extends MutationBase<
    CreateEnvClassParams,
    CreateEnvClassResponse
> {
    createRequest(request: CreateEnvClassParams): AgsApiOptions<CreateEnvClassParams> {
        return {
            serviceName: 'AGSEstateManagementService',
            pathTemplate: 'envclasses',
            method: 'POST',
            payload: request,
        };
    }

    async onComplete(
        error: Error | null,
        data: CreateEnvClassResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Create envClass onError ' + error);
        } else if (data) {
            console.debug('Create envClass onSuccess ' + JSON.stringify(data));
        }
    }
}
