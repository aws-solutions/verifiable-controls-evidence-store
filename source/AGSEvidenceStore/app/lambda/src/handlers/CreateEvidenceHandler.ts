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
import { EvidenceService } from 'src/services/EvidenceService';
import AGSError from 'src/common/AGSError';
import { Logger, LoggerFactory } from '@apjsb-serverless-lib/logger';
import { CreateEvidenceInputValidator } from 'src/validators/CreateEvidenceInputValidator';

/**
 * @api {post} /evidences Create a new evidence
 * @apiGroup Evidences
 * @apiVersion 1.0.0
 * @apiParam {UUID} providerId The evidence provider's id.
 * @apiParam {string} targetId The evidence's target's id.
 * @apiParam {string[]} [additionalTargetIds] The evidence's additional target ids.
 * @apiParam {string} [correlationId] The evidence's correlation id.
 * @apiParam {string} schemaId The evidence's content's schema id.
 * @apiParam {Object} content The evidence's content.
 * @apiParam {Object[]} [attachments] The evidence's attachments.
 * @apiParam {string{...128}} attachments.objectKey The attachment's S3 object key.
 * @apiHeader {UUID} X-API-Key The evidence provider's api key.
 * @apiHeaderExample {json} Header-Example:
 *      {
 *          "X-API-Key": "eaa54921-d77b-46e1-af1c-1ab92c7209f7"
 *      }
 * @apiParamExample {json} Request-Example:
 *      {
 *          "providerId": "my-test-provider",
            "targetId": "my-app-2.1",
            "content": {
                "codeCoverage": "80%",
                "executionId": "0254b1a6-2a53-4b6e-9c71-adce4071d1db"
            },
            "schemaId": "code-coverage-1.0"
 *      }
 * @apiSuccess (Success 201) {UUID} evidenceId The evidence's id.
 * @apiSuccess (Success 201) {UUID} providerId The issuing evidence provider's id.
 * @apiSuccess (Success 201) {string} providerName The issuing evidence provider's name.
 * @apiSuccess (Success 201) {string} targetId The evidence's target's id.
 * @apiSuccess (Success 201) {string} [correlationId] The evidence's correlation id.
 * @apiSuccess (Success 201) {string} createdTimestamp The evidence's created timestamp.
 * @apiSuccess (Success 201) {string} schemaId The evidence's schema's id.
 * @apiSuccess (Success 201) {Object} content The evidence's content.
 * @apiSuccess (Success 201) {Object[]} [attachments] The evidence's attachments.
 * @apiSuccess (Success 201) {string} attachments.objectKey The attachment's S3 object key.
 * @apiSuccess (Success 201) {string} attachments.hash The attachment's hash value in base64url encoded format.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 201 Created
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
 * @apiUse InternalError
 * @apiSampleRequest off
 */
@injectable()
export class CreateEvidenceHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    private readonly logger: Logger;
    constructor(
        @inject(EvidenceService) private service: EvidenceService,
        @inject(CreateEvidenceInputValidator)
        private validator: CreateEvidenceInputValidator,
        @inject('LoggerFactory') loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.getLogger('CreateEvidenceHandler');
    }

    async handle(
        event: APIGatewayProxyEvent,
        _context: Context
    ): Promise<BasicHttpResponse> {
        this.logger.debug('Processing create evidence request');
        const input = this.validator.parseAndValidate(event);

        const apiKey = event.requestContext?.identity?.apiKey;

        if (!apiKey) {
            return BasicHttpResponse.ofError(
                new AGSError('X-API-Key header cannot be null or empty.', 403, false)
            );
        }

        const response = await this.service.createEvidence({
            ...input,
            apiKey: apiKey,
        });

        return BasicHttpResponse.ofObject(201, response);
    }
}
