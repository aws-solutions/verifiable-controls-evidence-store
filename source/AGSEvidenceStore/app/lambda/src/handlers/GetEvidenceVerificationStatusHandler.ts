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
import {
    readMandatoryPathParameter,
    readOptionalPathParameter,
} from './LambdaEventHelpers';

/**
 * @api {get} /evidences/{id}/verificationstatus Get evidence verification status
 * @apiGroup Evidences
 * @apiVersion 1.0.0
 * @apiParam {UUID} id The evidence's id.
 * @apiSuccess {Verified|Unverified} verificationStatus
 * @apiSuccess {Object} [evidence] The evidence data.
 * @apiSuccess {UUID} evidence.evidenceId The evidence's id.
 * @apiSuccess {UUID} evidence.providerId The issuing evidence provider's id.
 * @apiSuccess {string} evidence.providerName The issuing evidence provider's name.
 * @apiSuccess {string} evidence.targetId The evidence's target's id.
 * @apiSuccess {string} [evidence.correlationId] The evidence's correlation id.
 * @apiSuccess {string} evidence.createdTimestamp The evidence's created timestamp in ISO format.
 * @apiSuccess {string} evidence.schemaId The evidence's schema's id.
 * @apiSuccess {Object} evidence.content The evidence's content.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
        {
            "verificationStatus": "Verified",
            "evidence": {
                "evidenceId": "34e8e89a-3e5d-4add-b435-c052081309dc",
                "providerId": "canary-authority",
                "targetId": "canary",
                "createdTimestamp": "2021-06-02T03:02:44.472Z",
                "content": {
                    "codeCoverage": "80%",
                    "executionId": "ac25a528-7e21-48d1-a8a0-2d3437a04062"
                },
                "schemaId": "canary-test-schema"
            }
        }
 * @apiUse InvalidParams
 * @apiUse ResourceNotFound
 * @apiUse InternalError
 * @apiSampleRequest off
 */
@injectable()
export class GetEvidenceVerificationStatusHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    constructor(@inject(EvidenceService) private service: EvidenceService) {}

    async handle(
        event: APIGatewayProxyEvent,
        _context: Context
    ): Promise<BasicHttpResponse> {
        const evidenceId = readMandatoryPathParameter(event, 'id');
        const revisionId = readOptionalPathParameter(event, 'revisionId');

        return BasicHttpResponse.ofObject(
            200,
            await this.service.verifyEvidence(evidenceId, revisionId)
        );
    }
}
