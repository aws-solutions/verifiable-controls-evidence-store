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
export class AppConfiguration {
    readonly applicationName: string;
    readonly runningLocally: boolean;
    readonly logLevel: string;
    constructor(applicationName: string) {
        this.applicationName = applicationName;

        this.runningLocally = process.env.AWS_SAM_LOCAL ? true : false;

        this.logLevel = process.env.LOG_LEVEL ?? 'debug';
    }
    readonly evidenceProviderTableName: string =
        process.env[environmentVariables.EvidenceProviderTableName] ??
        'evidence-providers';
    readonly evidenceSchemaTableName: string =
        process.env[environmentVariables.EvidenceSchemaTableName] ?? 'evidence-schemas';
    readonly evidenceContentBucketName: string =
        process.env[environmentVariables.EvidenceContentBucketName] ?? '';
    readonly evidenceLedgerName: string =
        process.env[environmentVariables.EvidenceLedgerName] ?? 'Evidences';
    readonly evidenceElasticSearchNode: string =
        process.env[environmentVariables.EvidenceElasticSearchNode] ??
        'http://localhost/';
    readonly evidenceElasticSearchDomain: string = `${this.evidenceElasticSearchNode}_opendistro/`;
    readonly evidenceStoreApiUsagePlanSSMParameter: string =
        process.env[environmentVariables.EvidenceStoreApiUsagePlanSSMParameter] ??
        '/ags/evidencestore/api-usage-plan-id';
    readonly proxyUri: string | undefined = process.env[environmentVariables.ProxyUri];
    readonly customUserAgent: string =
        process.env[environmentVariables.UserAgent] ?? 'Evidence Store';
    readonly evidenceAttachmentBucketName =
        process.env[environmentVariables.EvidenceAttachmentBucketName] ??
        'attachment-bucket';
}

export const environmentVariables = {
    EvidenceLedgerName: 'EVIDENCE_LEDGER_NAME',
    EvidenceContentBucketName: 'EVIDENCE_CONTENT_BUCKET_NAME',
    EvidenceProviderTableName: 'EVIDENCE_PROVIDER_TABLE_NAME',
    EvidenceElasticSearchNode: 'EVIDENCE_ELASTICSEARCH_NODE',
    EvidenceSchemaTableName: 'EVIDENCE_SCHEMA_TABLE_NAME',
    EvidenceStoreApiUsagePlanSSMParameter: 'API_USAGE_PLAN_PARAM',
    ProxyUri: 'PROXY_URI',
    UserAgent: 'SOLUTION_USER_AGENT',
    EvidenceAttachmentBucketName: 'EVIDENCE_ATTACHMENT_BUCKET_NAME',
};
