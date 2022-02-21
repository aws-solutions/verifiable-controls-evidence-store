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
import { AgsApiOptions, MutationBase } from '@ags/webclient-core/queries';
import { AttachmentLinkResponse, GenerateAttachmentLinkParams } from '../../types';

export class GenerateAttachmentLink extends MutationBase<
    GenerateAttachmentLinkParams,
    AttachmentLinkResponse
> {
    createRequest(
        request: GenerateAttachmentLinkParams
    ): AgsApiOptions<GenerateAttachmentLinkParams> {
        return request.revisionId
            ? {
                  serviceName: 'AGSEvidenceStore',
                  pathTemplate:
                      'evidences/{id}/revisions/{revisionId}/attachments/{attachmentId}',
                  method: 'GET',
                  pathParameters: {
                      id: request.evidenceId,
                      attachmentId: request.attachmentId,
                      revisionId: request.revisionId,
                  },
              }
            : {
                  serviceName: 'AGSEvidenceStore',
                  pathTemplate: 'evidences/{id}/attachments/{attachmentId}',
                  method: 'GET',
                  pathParameters: {
                      id: request.evidenceId,
                      attachmentId: request.attachmentId,
                  },
              };
    }
}
