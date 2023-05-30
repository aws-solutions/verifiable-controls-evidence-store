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
export interface FullEvidenceOutput {
    evidenceId: string;
    providerId: string;
    providerName: string;
    targetId: string;
    correlationId?: string;
    createdTimestamp: string;
    schemaId: string;
    content?: Record<string, unknown>;
    additionalTargetIds?: string[];
    metadata?: Record<string, unknown>;
    attachments?: { objectKey: string; attachmentId: string; size?: number }[];
}

export interface FullEvidenceOutputWithVersion extends FullEvidenceOutput {
    version: number;
}
