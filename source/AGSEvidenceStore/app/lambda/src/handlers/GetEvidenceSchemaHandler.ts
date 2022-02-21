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
import { inject, injectable } from 'tsyringe';
import { readMandatoryPathParameter } from './LambdaEventHelpers';

/**
 * @api {get} /providers/:id/schemas/:schemaId Get evidence schema by id
 * @apiGroup Provider
 * @apiVersion 1.0.0
 * @apiParam {UUID} id The evidence provider's id.
 * @apiParam {string} schemaId The evidence schema's id.
 * @apiSuccess {UUID} providerId The attestatiton authority's id.
 * @apiSuccess {string} schemaId The evidence schema's id.
 * @apiSuccess {string} createdTimestamp The evidence schema's created timestamp in ISO format.
 * @apiSuccess {string} [description] The evidence schema's description.
 * @apiSuccess {Object} content The JSON schema content.
 * @apiSuccessExample {json} Response-Example:
 *      HTTP/1.1 OK
 *      {
 *          "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
 *          "schemaId": "test-coverage-1.0",
 *          "createdTimestamp": "2021-05-07T08:39:49.304Z",
 *          "content": {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "$id": "https://example.com/product.schema.json",
                "title": "Product",
                "description": "A product in the catalog",
                "type": "object"
 *          }
 *      }
 */
@injectable()
export class GetEvidenceSchemaHandler
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
        const providerId = readMandatoryPathParameter(event, 'id');
        const schemaId = readMandatoryPathParameter(event, 'schemaId');

        const schema = await this.service.getEvidenceSchema({ providerId, schemaId });

        return schema
            ? BasicHttpResponse.ofObject(200, schema)
            : BasicHttpResponse.ofError(new AGSError(undefined, 404, false));
    }
}
