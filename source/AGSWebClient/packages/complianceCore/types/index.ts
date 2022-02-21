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
export const COMPLIANT = 'COMPLIANT';
export const NON_COMPLIANT = 'NON_COMPLIANT';

export interface CompliancePosture {
    businessUnitId: string;
    estateId: string;
    applicationId: string;
    releaseId: string;
    environmentClass: string;
    environmentId: string;
    deploymentId?: string;
    deploymentStatus?: string;
    runtimeStatus?: string;
}

export interface ComplianceStatusSummary {
    id: string;
    compliantList: CompliancePosture[];
    nonCompliantList: CompliancePosture[];
}

export interface GovernedEntity {
    entityType: 'ENTERPRISE' | 'BUSINESS_UNIT' | 'ESTATE' | 'APPLICATION';
    entityId: string;
}
