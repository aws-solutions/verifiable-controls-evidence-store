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
import AGSError from 'src/common/AGSError';
import { EvidenceProviderService } from 'src/services/EvidenceProviderService';
import { CreateEvidenceSchemaInputValidator } from 'src/validators/CreateEvidenceSchemaInputValidator';
import { inject, injectable } from 'tsyringe';
import { readMandatoryPathParameter } from './LambdaEventHelpers';

/**
 * @api {post} /providers/:id/schemas Add a new evidence schema
 * @apiGroup Providers
 * @apiVersion 1.0.0
 * @apiParam {UUID} id The evidence provider's id.
 * @apiParam {UUID} providerId The evidence provider's id.
 * @apiParam {string} schemaId The schema's id.
 * @apiParam {string} [description] The schema's description.
 * @apiParam {Object} content the JSON schema.
 * @apiParamExample {json} Request-Example:
 *      {
 *          "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
 *          "schemaId": "test-coverage-1.0",
 *          "description": "Test coverage schema",
 *          "content": {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "$id": "https://example.com/product.schema.json",
                "title": "Product",
                "description": "A product in the catalog",
                "type": "object"
 *          }
 *      }
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 201 Created
 *      {}
 * @apiUse InvalidParams
 * @apiUse ResourceNotFound
 * @apiUse InternalError
 * @apiSampleRequest off
 */
@injectable()
export class CreateEvidenceSchemaHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    constructor(
        @inject(EvidenceProviderService)
        private service: EvidenceProviderService,
        @inject(CreateEvidenceSchemaInputValidator)
        private validator: CreateEvidenceSchemaInputValidator
    ) {}

    async handle(
        event: APIGatewayProxyEvent,
        _context: Context
    ): Promise<BasicHttpResponse> {
        const providerId = readMandatoryPathParameter(event, 'id');

        const input = this.validator.parseAndValidate(event);

        if (providerId != input.providerId) {
            return BasicHttpResponse.ofError(new AGSError(undefined, 400, false));
        }

        let ttl: number | undefined = undefined;
        const ttlHeaderValue = event.headers?.['ttl'];

        if (ttlHeaderValue) {
            const defaultTtl = 5;
            const value = parseInt(ttlHeaderValue);

            ttl = isNaN(value) ? undefined : value;
            ttl = ttl && ttl > defaultTtl ? defaultTtl : ttl;
        }

        await this.service.createEvidenceSchema(input, ttl);

        return BasicHttpResponse.ofObject(201, {});
    }
}
