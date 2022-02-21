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
    UpdateControlTechniqueParams,
    UpdateControlTechniqueResponse,
} from '../../types';

export class UpdateControlTechniqueMutation extends MutationBase<
    UpdateControlTechniqueParams,
    UpdateControlTechniqueResponse
> {
    createRequest(
        request: UpdateControlTechniqueParams
    ): AgsApiOptions<UpdateControlTechniqueParams> {
        return {
            serviceName: 'AGSRiskManagementService',
            pathTemplate: 'controltechniques/{id}',
            method: 'PUT',
            pathParameters: { id: request.id },
            payload: {
                name: request.name,
                description: request.description,
                controlType: request.controlType,
                enabled: request.enabled,
                techniqueDetails: {
                    integrationType: request.techniqueDetails.integrationType,
                    policyId: request.techniqueDetails.policyId,
                    bundleName: request.techniqueDetails.bundleName,
                    namespace: request.techniqueDetails.namespace,
                    restEndpoint: request.techniqueDetails.restEndpoint,
                    eventBus: request.techniqueDetails.eventBus,
                    detailType: request.techniqueDetails.detailType,
                    awsPolicyArn: request.techniqueDetails.awsPolicyArn,
                },
            },
        };
    }

    async onComplete(
        error: Error | null,
        data: UpdateControlTechniqueResponse | null
    ): Promise<void> {
        if (error) {
            console.debug('Create Control Technique onError ' + error);
        } else if (data) {
            console.debug('Create Control Technique onSuccess ' + JSON.stringify(data));
        }
    }
}
