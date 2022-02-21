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
import { Logger, LoggerFactory } from '@apjsb-serverless-lib/logger';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import AGSError from 'src/common/AGSError';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import { EvidenceService } from 'src/services/EvidenceService';
import { generateSignedUrl } from 'src/services/S3UrlHelper';
import { inject, injectable } from 'tsyringe';
import {
    readMandatoryPathParameter,
    readOptionalPathParameter,
} from './LambdaEventHelpers';

/**
 * @api {get} /evidences/{id}/attachments/{attachmentHash} Get attachment download url
 * @apiGroup Evidences
 * @apiVersion 1.0.0
 * @apiParam (Path parameter) {UUID} id The evidence's id.
 * @apiParam (Path parameter) {string} attachmentHash The evidence attachment's hash value.
 * @apiSuccess {string} url The pre-signed S3 url to download the attachment
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "url": "https://sample-bucket.s3.ap-southeast-2.amazonaws.com/attachment.doc"
 *      }
 * @apiUse InvalidParams
 * @apiUse ResourceNotFound
 * @apiUse InternalError
 * @apiSampleRequest off
 */

@injectable()
export class GetAttachmentLinkHandler
    implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse>
{
    private readonly logger: Logger;
    private readonly bucketName: string;
    constructor(
        @inject(EvidenceService) private service: EvidenceService,
        @inject('AppConfiguration') appConfig: AppConfiguration,
        @inject('LoggerFactory') loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.getLogger('GetAttachmentHandler');
        this.bucketName = appConfig.evidenceAttachmentBucketName;
    }
    async handle(
        event: APIGatewayProxyEvent,
        _context: Context
    ): Promise<BasicHttpResponse> {
        this.logger.debug('Processing get attachment link request');

        const evidenceId = readMandatoryPathParameter(event, 'id');
        const attachmentId = readMandatoryPathParameter(event, 'attachmentId');
        const revisionId = readOptionalPathParameter(event, 'revisionId');

        const evidence = await this.service.getEvidenceById(evidenceId, revisionId);

        if (!evidence) {
            return BasicHttpResponse.ofError(
                new AGSError('Could not find evidence with the requested id.', 404, false)
            );
        }

        const attachment = evidence.attachments?.filter(
            (x) => x.attachmentId === attachmentId
        )?.[0];

        if (!attachment) {
            return BasicHttpResponse.ofError(
                new AGSError(
                    'Could not find attachment with the requested id.',
                    404,
                    false
                )
            );
        }

        return BasicHttpResponse.ofObject(200, {
            url: generateSignedUrl(this.bucketName, attachment.objectKey),
        });
    }
}
