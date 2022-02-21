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
import { CreateProviderInputValidator } from 'src/validators/CreateProviderInputValidator';

/**
 * @api {post} /providers Create new provider
 * @apiGroup Providers
 * @apiVersion 1.0.0
 * @apiParam {string{..36}} [providerId] The evidence provider's id.
 * @apiParam {string{..128}} name The evidence provider's name.
 * @apiParam {String{..128}} [description] The evidence provider's description.
 * @apiParam {Object[]} [schemas] The evidence provider's schema.
 * @apiParam {string{..128}} schemas.schemaId The schema's id.
 * @apiParam {string{..128}} [schemas.description] The schema's description.
 * @apiParam {Object} schemas.content the JSON schema.
 * @apiParamExample {json} Request-Example:
 *      {
 *          "name": "my evidence provider",
 *          "description": "a new evidence provider"
 *      }
 * @apiSuccess (Success 201) {string} providerId The evidence provider's id.
 * @apiSuccess (Success 201) {string} name The evidence provider's name.
 * @apiSuccess (Success 201) {string} createdTimestamp The evidence provider's created timestemp in ISO format.
 * @apiSuccess (Success 201) {string} [description] The evidence provider's description.
 * @apiSuccess (Success 201) {boolean} enabled Flag indicating whether the evidence provider is enabled.
 * @apiSuccess (Success 201) {string} apiKey The api key assigned to the evidence provider.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 201 Created
 *      {
 *          "name": "my evidence provider",
 *          "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
 *          "createdTimestamp": "2021-05-07T08:39:49.304Z",
 *          "description": "A new evidence provider",
 *          "enabled": true,
 *          "apiKey": "my-new-api-key"
 *      }
 * @apiUse InvalidParams
 * @apiUse InternalError
 * @apiSampleRequest off
 */
@injectable()
export class CreateProviderHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    constructor(
        @inject(EvidenceProviderService) private service: EvidenceProviderService,
        @inject(CreateProviderInputValidator)
        private validator: CreateProviderInputValidator
    ) {}

    async handle(
        event: APIGatewayProxyEvent,
        _context: Context
    ): Promise<BasicHttpResponse> {
        const input = this.validator.parseAndValidate(event);

        let ttl: number | undefined = undefined;
        const ttlHeaderValue = event.headers?.['ttl'];

        if (ttlHeaderValue) {
            const defaultTtl = 5;
            const value = parseInt(ttlHeaderValue);

            ttl = isNaN(value) ? undefined : value;
            ttl = ttl && ttl > defaultTtl ? defaultTtl : ttl;
        }

        const authority = await this.service.createEvidenceProvider(input, ttl);

        return BasicHttpResponse.ofObject(201, authority);
    }
}
