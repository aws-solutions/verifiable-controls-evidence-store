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
import { EvidenceService } from 'src/services/EvidenceService';
import { inject, injectable } from 'tsyringe';
import {
    readMandatoryPathParameter,
    readOptionalPathParameter,
} from './LambdaEventHelpers';

/**
 * @api {get} /evidences/{id} Get evidence by id
 * @apiGroup Evidences
 * @apiVersion 1.0.0
 * @apiParam {UUID} id The evidence's id.
 * @apiSuccess {UUID} evidenceId The evidence's id.
 * @apiSuccess {UUID} providerId The issuing evidence provider's id.
 * @apiSuccess {string} providerName The issuing evidence provider's name.
 * @apiSuccess {string} targetId The evidence's target's id.
 * @apiSuccess {string} [correlationId] The evidence's correlation id.
 * @apiSuccess {string} createdTimestamp The evidence's created timestamp.
 * @apiSuccess {string} schemaId The evidence's schema's id.
 * @apiSuccess {Object} content The evidence's content.
 * @apiSuccess {Object[]} [attachments] The evidence's attachments.
 * @apiSuccess {string} attachments.objectKey The attachment's S3 object key.
 * @apiSuccess {string} attachments.attachmentId The attachment's id.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
            "evidenceId": "e8176aff-afc1-4936-8935-19d922ca98a6",
            "providerId": "my-test-authority",
            "targetId": "my-app-2.1",
            "createdTimestamp": "2021-05-07T08:39:49.304Z",
            "content": {
                "codeCoverage": "80%",
                "executionId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db"
            },
            "schemaId": "code-coverage-1.0"
        }
 * @apiUse InvalidParams
 * @apiUse ResourceNotFound
 * @apiUse InternalError
 * @apiSampleRequest off
 */
@injectable()
export class GetEvidenceHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    constructor(@inject(EvidenceService) private service: EvidenceService) {}

    async handle(
        event: APIGatewayProxyEvent,
        _context: Context
    ): Promise<BasicHttpResponse> {
        const requestedEvidenceId = readMandatoryPathParameter(event, 'id');
        const requestedRevisionId = readOptionalPathParameter(event, 'revisionId');

        const evidence = await this.service.getEvidenceById(
            requestedEvidenceId,
            requestedRevisionId
        );

        return evidence
            ? BasicHttpResponse.ofObject(200, evidence)
            : BasicHttpResponse.ofError(
                  new AGSError(
                      `Could not find evidence with the requested id.`,
                      404,
                      false
                  )
              );
    }
}
