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
export interface Risk {
    id: string;
    name: string;
    description: string;
    category: string;
    severity: string;
    likelihood: string;
    rating: string;
    controlObjectiveIds: string[];
    createTime: string;
    lastUpdateTime: string;
}

export interface RiskV2 {
    id: string;
    name: string;
    description: string;
    category: string;
    createTime: string;
    lastUpdateTime: string;
    mitigationStatus?: string;
}

export interface RiskSummary {
    id: string;
    name: string;
    description: string;
    category: string;
}

export interface RiskSummaryV2 {
    id: string;
    name: string;
    description: string;
    category: string;
    countControlObjectivies: number;
    countTargetEntities: number;
    mitigationStatus?: string;
}

export interface RiskOptions {
    riskCategory: string[];
    riskSeverity: string[];
    riskLikelihood: string[];
    riskRating: string[];
}

export interface RiskTargetEntityImpact {
    name: string;
    severity: string;
    likelihood: string;
}

export interface RiskTargetEntity {
    type: string;
    id: string;
    owner: string;
    likelihood: string;
    impacts: RiskTargetEntityImpact[];
}

export interface CreateRiskParamsV2 {
    name: string;
    description: string;
    category: string;
    controlObjectiveIds?: string[];
    targetEntities?: RiskTargetEntity[];
}

export interface CreateRiskParams {
    name: string;
    description: string;
    category: string;
    severity: string;
    likelihood: string;
    rating: string;
    controlObjectiveIds?: string[];
}

export interface CreateRiskResponse {
    id: string;
    name: string;
}

export interface UpdateRiskParams {
    id: string;
    name?: string;
    description?: string;
    category?: string;
    severity?: string;
    likelihood?: string;
    rating?: string;
    controlObjectiveIds?: string[];
}

export interface UpdateRiskResponse {
    id: string;
    name: string;
}

export interface DeleteRiskParams {
    id: string;
}

export interface DeleteRiskResponse {
    id: string;
}
