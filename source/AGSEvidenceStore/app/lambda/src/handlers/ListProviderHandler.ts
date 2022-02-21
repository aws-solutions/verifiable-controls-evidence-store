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
import { SearchEvidenceProviderInput } from 'src/types/SearchEvidenceProviderInput';
import { inject, injectable } from 'tsyringe';
import { readQueryStringValue } from './LambdaEventHelpers';

/**
 * @api {get} /providers List providers
 * @apiGroup Providers
 * @apiVersion 1.0.0
 * @apiParam (Optional Query Parameters) {number{1-50}} [limit=50] The number of authorities per page.
 * @apiParam (Optional Query Parameters) {string} [nextToken] The pagination token.
 * @apiParam (Optional Query Parameters) {string} [providerId] The evidence provider id search query.
 * @apiParam (Optional Query Parameters) {string} [name] The evidence provider name search query.
 * @apiParam (Optional Query Parameters) {string} [description] The evidence provider description search query.
 * @apiParam (Optional Query Parameters) {string} [schemaId] The evidence schema id search query.
 * @apiSuccess {Object[]} results The list of evidence providers.
 * @apiSuccess {string} results.providerId The evidence provider's id.
 * @apiSuccess {string} results.name The evidence provider's name.
 * @apiSuccess {string} [results.description] The evidence provider's description.
 * @apiSuccess {string} results.createdTimestamp The evidence provider's created timestamp in ISO format.
 * @apiSuccess {boolean} results.enabled The flag indicating whether the evidence provider is enabled.
 * @apiSuccess {Object[]} [results.schemas] The list of schemas associated with the evidence provider.
 * @apiSuccess {string} [results.schemas.schemaId] The schema's id.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "results": [
 *              {
 *                 "providerId": "my-authority",
 *                  "createdTimestamp": "2021-07-15T11:07:56.018Z",
 *                  "enabled": true,
 *                  "name": "my-authority-name",
 *                  "schemas": [
 *                      {
 *                          "schemaId": "schema-1.0"
 *                      }
 *                  ]
 *              }
 *          ]
 *      }
 * @apiUse InternalError
 * @apiSampleRequest off
 */
@injectable()
export class ListProviderHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    constructor(
        @inject(EvidenceProviderService)
        private service: EvidenceProviderService
    ) {}

    async handle(event: APIGatewayProxyEvent, _: Context): Promise<BasicHttpResponse> {
        const searchInput = this.parseQueryString(event);

        const result = await this.service.listEvidenceProviders(searchInput);

        return BasicHttpResponse.ofObject(200, result);
    }

    private parseQueryString(event: APIGatewayProxyEvent): SearchEvidenceProviderInput {
        const limitQueryString = readQueryStringValue(event, 'limit');
        const nextToken = readQueryStringValue(event, 'nextToken');
        const providerId = readQueryStringValue(event, 'providerId');
        const name = readQueryStringValue(event, 'name');
        const description = readQueryStringValue(event, 'description');
        const schemaId = readQueryStringValue(event, 'schemaId');

        let limit = 50;
        if (limitQueryString) {
            const value = parseInt(limitQueryString);

            limit = isNaN(value) && value < 50 ? limit : value;
        }

        return {
            providerId,
            description,
            name,
            limit,
            nextToken,
            schemaId,
        };
    }
}
