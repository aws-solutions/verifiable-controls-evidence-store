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

export interface SearchEvidenceResponse {
    total: number;
    results: FullEvidenceOutput[];
}

export interface FullEvidenceOutput {
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

export interface Evidence {
    providerId: string;
    targetId: string;
    additionalTargetIds?: string[];
    content: Content;
    schemaId: string;
    attachments?: [{ objectKey: string }];
}

export interface Content {
    source: string;
    severity: 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // mapped to severity
    findingId: string; // mapped to finding id
    findingProduct: string; // mapped to finding product name or product arn
    summary: string; // mapped to finding title
    createdAt: string; // mapped to finding created at,
    updatedAt: string; // mapped to finding updated at
    accountId: string; // mapped to finding account id
    region?: string; // mapped to finding region
    status?: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'DEFERRED' | 'DUPLICATE'; // mapped to finding workflow status,
    remediationRecommendation?: {
        text?: string;
        url?: string;
    };
    agsContext?: AgsContext;
}

export interface AgsContext {
    applicationName?: string;
    applicationId?: string;
    environmentName?: string;
    environmentId?: string;
    releaseId?: string;
    deploymentId?: string;
}

export class Message {
    detail: any;
}
