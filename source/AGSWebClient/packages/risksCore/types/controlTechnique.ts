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
export interface TechniqueDetails {
    integrationType: string;
    policyId?: string;
    bundleName?: string;
    namespace?: string;
    restEndpoint?: string;
    eventBus?: string;
    detailType?: string;
    awsPolicyArn?: string;
    configRuleArn?: string;
    cpSourceUrls?: string;
}

export interface ControlTechnique {
    id: string;
    name: string;
    description: string;
    controlType: string;
    enabled: boolean;
    status: string;
    techniqueDetails: TechniqueDetails;
    controlObjectives: string[];
    createTime: string;
    lastUpdateTime: string;
}

export interface ControlTechniqueSummary {
    id: string;
    name: string;
    controlType: string;
    description: string;
}

export interface CreateControlTechniqueParams {
    name: string;
    description: string;
    controlType: string;
    status?: string;
    enabled?: boolean;
    techniqueDetails: TechniqueDetails;
}

export interface CreateControlTechniqueResponse {
    id: string;
    name: string;
}

export interface UpdateControlTechniqueParams {
    id: string;
    name: string;
    description?: string;
    controlType?: string;
    status?: string;
    enabled?: boolean;
    techniqueDetails: TechniqueDetails;
}

export interface UpdateControlTechniqueResponse {
    id: string;
    name: string;
}

export interface DeleteControlTechniqueParams {
    id: string;
}

export interface DeleteControlTechniqueResponse {
    id: string;
}
