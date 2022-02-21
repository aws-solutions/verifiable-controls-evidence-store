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

export interface BusinessUnit {
    id: string;
    parentId: string;
    name: string;
    unitType: 'BusinessUnit' | 'Enterprise';
    description: string;
    businessOwner: string;
    riskOwner?: string;
    techOwner?: string;
    applicationOwnerIds: string[];
    children: string[];
    controlObjectiveIds: string[];
    createTime: string;
    lastUpdateTime: string;
}

export interface BusinessUnitSummary {
    id: string;
    parentId: string;
    name: string;
    unitType: 'BusinessUnit' | 'Enterprise';
}

export interface CreateBusinessUnitParams {
    parentId?: string;
    name: string;
    description: string;
    businessOwner: string;
    riskOwner?: string;
    techOwner?: string;
    applicationOwnerIds?: string[];
}

export interface CreateBusinessUnitResponse {
    id: string;
    name: string;
}

export interface UpdateBusinessUnitParams {
    id?: string;
    parentId?: string;
    name?: string;
    description?: string;
    businessOwner?: string;
    riskOwner?: string;
    techOwner?: string;
    applicationOwnerIds?: string[];
}

export interface UpdateBusinessUnitResponse {
    id: string;
    name: string;
}

export interface DeleteBusinessUnitParams {
    id: string;
}

export interface DeleteBusinessUnitResponse {
    id: string;
}
