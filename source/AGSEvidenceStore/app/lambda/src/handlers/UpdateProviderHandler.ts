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
import { BasicHttpResponse } from '@apjsb-serverless-lib/common-types';
import { AsyncHandlerObj } from '@apjsb-serverless-lib/middleware-chain';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { inject, injectable } from 'tsyringe';
import AGSError from 'src/common/AGSError';
import { UpdateProviderInputValidator } from 'src/validators/UpdateProviderInputValidator';
import { readMandatoryPathParameter } from './LambdaEventHelpers';

/**
 * @api {put} /providers/:id Enable/disable provider
 * @apiGroup Providers
 * @apiVersion 1.0.0
 * @apiParam {UUID} id The evidence provider's id.
 * @apiParam {UUID} providerId The evidence provider's id.
 * @apiParam {boolean} enabled The flag indicating whether the evidence provider is enabled.
 * @apiParamExample {json} Request-Example:
 *      {
 *          "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
 *          "enabled": true
 *      }
 * @apiSuccess {UUID} providerId The evidence provider's id.
 * @apiSuccess {string} name The evidence provider's name.
 * @apiSuccess {string} createdTimestamp The evidence provider's created timestemp in ISO format.
 * @apiSuccess {string} [description] The evidence provider's description.
 * @apiSuccess {boolean} enabled Flag indicating whether the attesation authority is enabled.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "name": "my attetastation authority",
 *          "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
 *          "createdTimestamp": "2021-05-07T08:39:49.304Z",
 *          "description": "A new evidence provider",
 *          "enabled": true,
 *      }
 * @apiUse InvalidParams
 * @apiUse ResourceNotFound
 * @apiUse InternalError
 * @apiSampleRequest off
 */
@injectable()
export class UpdateProviderHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    constructor(
        @inject(EvidenceProviderService)
        private service: EvidenceProviderService,
        @inject(UpdateProviderInputValidator)
        private validator: UpdateProviderInputValidator
    ) {}

    async handle(
        event: APIGatewayProxyEvent,
        _context: Context
    ): Promise<BasicHttpResponse> {
        const requestedproviderId = readMandatoryPathParameter(event, 'id');

        const input = this.validator.parseAndValidate(event);

        if (input.providerId != requestedproviderId) {
            return BasicHttpResponse.ofError(new AGSError(undefined, 400, false));
        }

        const provider = await this.service.toggleProviderStatus(
            input.providerId,
            input.enabled
        );

        return BasicHttpResponse.ofObject(200, provider);
    }
}
