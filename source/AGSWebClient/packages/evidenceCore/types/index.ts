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
import { UserCredential } from '@ags/webclient-core/types';

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
export interface Evidence {
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
    attachments?: { objectKey: string; attachmentId: string }[];
    version?: string;
}

export interface EvidenceProvider {
    providerId: string;
    createdTimestamp: string;
    enabled: boolean;
    name: string;
    description: string;
    schemas?: SchemaId[];
}

export interface SchemaId {
    schemaId: string;
    content?: string;
}

export interface EvidenceVerificationStatus {
    verificationStatus: 'Verified' | 'Unverified';
}
export interface SchemaDetails {
    schemaId: string;
    createdTimestamp: string;
    providerId: string;
    content: any;
}
export enum EvidenceProviderType {
    CFN_NAG = 'cfn_nag',
    DEPLOYMENT_GATE = 'Deployment Gate',
    CFN_GUARD = 'CloudFormation Guard',
    CODE_GURU = 'CodeGuru',
    CONTAINER_IMAGE_SCAN = 'Container Image Scan',
}

export interface CreateEvidenceParams {
    apiKey: string;
    providerId: string;
    targetId: string;
    correlationId?: string;
    schemaId: string;
    content?: Record<string, unknown>;
    additionalTargetIds?: string[];
    metadata?: Record<string, unknown>;
    attachments?: { objectKey: string }[];
}

export interface CreateEvidenceResponse {
    evidenceId: string;
    providerId: string;
    targetId: string;
    correlationId?: string;
    createdTimestamp: string;
    schemaId: string;
    content?: Record<string, unknown>;
    additionalTargetIds?: string[];
    metadata?: Record<string, unknown>;
}

export interface CreateEvidenceProviderParams {
    providerId?: string;
    name: string;
    description?: string;
    schemas?: { schemaId: string; content: Record<string, any>; description?: string }[];
}

export interface CreateEvidenceProviderResponse {
    providerId: string;
    name: string;
    createdTimestamp: string;
    description?: string;
    enabled: boolean;
    schemas?: { schemaId: string }[];
    apiKey: string;
}

export interface FileUploadParams {
    sessionId: string;
    file: any;
    userCredential: UserCredential;
}

export interface GenerateAttachmentLinkParams {
    evidenceId: string;
    attachmentId: string;
    revisionId?: string;
}

export interface AttachmentLinkResponse {
    url: string;
}

export interface CreateSchemaParams {
    providerId: string;
    schemaId: string;
    content: Record<string, any>;
    description?: string;
}
