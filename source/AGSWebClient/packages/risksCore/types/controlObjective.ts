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

export interface ControlObjective {
    id: string;
    name: string;
    description: string;
    createTime: string;
    lastUpdateTime: string;
    controlTechniqueIds: string[];
}

export interface ControlObjectiveSummary {
    id: string;
    name: string;
    description: string;
}

export interface CreateControlObjectiveParams {
    name: string;
    description: string;
    controlTechniqueIds?: string[];
}

export interface CreateControlObjectiveResponse {
    id: string;
    name: string;
}

export interface UpdateControlObjectiveParams {
    id: string;
    name?: string;
    description?: string;
    controlTechniqueIds?: string[];
}

export interface UpdateControlObjectiveResponse {
    id: string;
    name: string;
}

export interface DeleteControlObjectiveParams {
    id: string;
}

export interface DeleteControlObjectiveResponse {
    id: string;
}
