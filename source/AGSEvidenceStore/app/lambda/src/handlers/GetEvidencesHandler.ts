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
import { EvidenceService } from 'src/services/EvidenceService';
import { inject, injectable } from 'tsyringe';
import { GetEvidencesInputValidator } from 'src/validators/GetEvidencesInputValidator';

/**
 * @api {post} /evidences/search Query evidences
 * @apiGroup Evidences
 * @apiVersion 1.0.0
 * @apiParam {string[]} [targetIds] The list of target ids.
 * @apiParam {string} [providerId] The evidence's provider id search term.
 * @apiParam {string[]} [providerIds] The list of evidence provider ids.
 * @apiParam {string} [schemaId] The evidence's schema id search term.
 * @apiParam {string} [content] The content search term.
 * @apiParam {number{1-20}} [limit=10] The number of evidences per page.
 * @apiParam {string} [nextToken] The pagination token.
 * @apiParam {string} [fromTimestamp] The start time stamp value in ISO format.
 * @apiParam {string} [toTimestamp] The end time stamp value in ISO format.
 * @apiParamExample {json} Request-Example:
 *      {
 *          "targetIds": ["my-app-1.0", "toolkit-2.1", "release-2.3"],
 *          "limit": 2,
 *          "nextToken": "MTAwfDEwMA"
 *      }
 * @apiSuccess {number} total The total number of matched items.
 * @apiSuccess {Object[]} results The search result.
 * @apiSuccess {UUID} results.evidenceId The evidence's id.
 * @apiSuccess {UUID} results.providerId The issuing evidence provider's id.
 * @apiSuccess {string} results.providerName The issuing evidence provider's name.
 * @apiSuccess {string} results.targetId The evidence's target's id.
 * @apiSuccess {string} results.[correlationId] The evidence's correlation id.
 * @apiSuccess {string} results.createdTimestamp The evidence's created timestamp in ISO format.
 * @apiSuccess {string} results.schemaId The evidence's schema's id.
 * @apiSuccess {Object} results.content The evidence's content.
 * @apiSuccess {Object[]} [attachments] The evidence's attachments.
 * @apiSuccess {string} attachments.objectKey The attachment's S3 object key.
 * @apiSuccess {string} attachments.attachmentId The attachment's id.
 * @apiSuccess {string} [nextToken] The pagination token.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
        {
        "total": 3076,
        "results": [
            {
            "evidenceId": "e8176aff-afc1-4936-8935-19d922ca98a6",
            "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
            "targetId": "toolkit-2.1",
            "createdTimestamp": "2021-05-07T08:39:49.304Z",
            "content": {
                "codeCoverage": "80%",
                "executionId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db"
            },
            "schemaId": "code-coverage-1.0"
            },
            {
            "evidenceId": "14f840ff-65a6-4f5b-a878-427a8f87ba5d",
            "providerId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db",
            "targetId": "release-2.3",
            "createdTimestamp": "2021-05-07T06:34:41.429Z",
            "content": {
                "codeCoverage": "80%",
                "executionId": "12cd7e84-c6a2-4f93-96fd-6dc9247a0777"
            },
            "schemaId": "code-coverage-1.0"
            }
        ],
        "nextToken": "Mnwy"
        }
 * @apiUse InvalidParams
 * @apiUse InternalError
 * @apiSampleRequest off
 */
@injectable()
export class GetEvidencesHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    constructor(
        @inject(EvidenceService) private service: EvidenceService,
        @inject(GetEvidencesInputValidator)
        private validator: GetEvidencesInputValidator
    ) {}

    async handle(
        event: APIGatewayProxyEvent,
        _context: Context
    ): Promise<BasicHttpResponse> {
        const input = this.validator.parseAndValidate(event);

        const result = await this.service.getEvidences(input);

        return BasicHttpResponse.ofObject(200, result);
    }
}
