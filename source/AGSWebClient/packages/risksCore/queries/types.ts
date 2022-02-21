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
export enum QueryType {
    LIST_RISKS = 'ListRisks',
    LIST_CONTROLOBJECTIVES = 'ListControlObjectives',
    LIST_ALL_CONTROLOBJECTIVES = 'ListAllControlObjectives',
    LIST_CONTROLTECHNIQUES = 'ListControlTechniques',
    LIST_ALL_CONTROLTECHNIQUES = 'ListAllControlTechniques',
    GET_RISK = 'GetRisk',
    GET_RISK_OPTIONS = 'GetRiskOptions',
    GET_CONTROLOBJECTIVE = 'GetControlObjective',
    GET_CONTROLTECHNIQUE = 'GetControlTechnique',
    GET_GOVERNED_ENTITY_ASSOCIATION = 'GetGovernedEntityAssociation',
}

export enum MutationType {
    CREATE_RISK = 'CreateRisk',
    UPDATE_RISK = 'UpdateRisk',
    DELETE_RISK = 'DeleteRisk',
    CREATE_CONTROLOBJECTIVE = 'CreateControlObjective',
    UPDATE_CONTROLOBJECTIVE = 'UpdateControlObjective',
    DELETE_CONTROLOBJECTIVE = 'DeleteControlObjective',
    CREATE_CONTROLTECHNIQUE = 'CreateControlTechnique',
    UPDATE_CONTROLTECHNIQUE = 'UpdateControlTechnique',
    DELETE_CONTROLTECHNIQUE = 'DeleteControlTechnique',
    UPDATE_GOVERNED_ENTITY_ASSOCIATION = 'UpdateGovernedEntityAssociation',
}
