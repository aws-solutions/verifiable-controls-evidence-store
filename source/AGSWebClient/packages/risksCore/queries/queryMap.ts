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

import { QueryType } from './types';
import { GetRisk } from './queries/getRisk';
import { GetRiskOptions } from './queries/getRiskOptions';
import { GetControlObjective } from './queries/getControlObjective';
import { GetControlTechnique } from './queries/getControlTechnique';
import { ListRisks } from './queries/listRisks';
import {
    ListControlObjectives,
    ListAllControlObjectives,
} from './queries/listControlObjectives';
import {
    ListControlTechniques,
    ListAllControlTechniques,
} from './queries/listControlTechniques';

const queryMap = {
    [QueryType.GET_RISK]: GetRisk,
    [QueryType.GET_RISK_OPTIONS]: GetRiskOptions,
    [QueryType.GET_CONTROLOBJECTIVE]: GetControlObjective,
    [QueryType.GET_CONTROLTECHNIQUE]: GetControlTechnique,
    [QueryType.LIST_RISKS]: ListRisks,
    [QueryType.LIST_CONTROLOBJECTIVES]: ListControlObjectives,
    [QueryType.LIST_ALL_CONTROLOBJECTIVES]: ListAllControlObjectives,
    [QueryType.LIST_CONTROLTECHNIQUES]: ListControlTechniques,
    [QueryType.LIST_ALL_CONTROLTECHNIQUES]: ListAllControlTechniques,
};

export default queryMap;
