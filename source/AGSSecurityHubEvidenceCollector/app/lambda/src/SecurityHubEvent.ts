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

/** as per https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-findings-format-attributes.html */
export interface SecurityHubEventDetail {
    findings: SecurityHubFinding[];
}

export interface SecurityHubFinding {
    AwsAccountId: string;
    CreatedAt: string;
    Description: string;
    GeneratorId: string;
    Id: string;
    ProductArn: string;
    Resources: ResourceDetail[];
    SchemaVersion: string;
    Severity: {
        Label: 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        Original: string;
    };
    Title: string;
    Types: string[];
    UpdatedAt: string;
    ProductName?: string;
    Workflow?: {
        Status:
            | 'NEW'
            | 'ASSIGNED'
            | 'IN_PROGRESS'
            | 'RESOLVED'
            | 'DEFERRED'
            | 'DUPLICATE';
    };
    Region?: string;
    Remediation?: {
        Recommendation?: {
            Text?: string;
            Url?: string;
        };
    };
}

export interface ResourceDetail {
    Id: string;
    Partition?: string;
    Region?: string;
    ResourceRole?: string;
    Tags?: { [key: string]: string };
    Type: string;
    DataClassification?: Record<string, unknown>;
    Details?: Record<string, unknown>;
}
