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
import { inject, injectable } from 'tsyringe';
import AGSError from 'src/common/AGSError';
import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { readMandatoryPathParameter } from './LambdaEventHelpers';

/**
 * @api {get} /providers/{id} Get provider by id
 * @apiGroup Providers
 * @apiVersion 1.0.0
 * @apiParam {string} id The evidence provider's id.
 * @apiSuccess {string} providerId The evidence provider's id.
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
export class GetProviderHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    constructor(
        @inject(EvidenceProviderService)
        private service: EvidenceProviderService
    ) {}

    async handle(
        event: APIGatewayProxyEvent,
        _context: Context
    ): Promise<BasicHttpResponse> {
        const requestedProviderId = readMandatoryPathParameter(event, 'id');

        const provider = await this.service.getEvidenceProviderById(requestedProviderId);

        return provider
            ? BasicHttpResponse.ofObject(200, provider)
            : BasicHttpResponse.ofError(new AGSError(undefined, 404, false));
    }
}
