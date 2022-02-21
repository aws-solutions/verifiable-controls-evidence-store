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

import { MutationType } from './types';
import { CreateRiskMutation } from './mutations/createRisk';
import { UpdateRiskMutation } from './mutations/updateRisk';
import { DeleteRiskMutation } from './mutations/deleteRisk';
import { CreateControlObjectiveMutation } from './mutations/createControlObjective';
import { UpdateControlObjectiveMutation } from './mutations/updateControlObjective';
import { DeleteControlObjectiveMutation } from './mutations/deleteControlObjective';
import { CreateControlTechniqueMutation } from './mutations/createControlTechnique';
import { UpdateControlTechniqueMutation } from './mutations/updateControlTechnique';
import { DeleteControlTechniqueMutation } from './mutations/deleteControlTechnique';

const mutationMap = {
    [MutationType.CREATE_RISK]: CreateRiskMutation,
    [MutationType.UPDATE_RISK]: UpdateRiskMutation,
    [MutationType.DELETE_RISK]: DeleteRiskMutation,
    [MutationType.CREATE_CONTROLOBJECTIVE]: CreateControlObjectiveMutation,
    [MutationType.UPDATE_CONTROLOBJECTIVE]: UpdateControlObjectiveMutation,
    [MutationType.DELETE_CONTROLOBJECTIVE]: DeleteControlObjectiveMutation,
    [MutationType.CREATE_CONTROLTECHNIQUE]: CreateControlTechniqueMutation,
    [MutationType.UPDATE_CONTROLTECHNIQUE]: UpdateControlTechniqueMutation,
    [MutationType.DELETE_CONTROLTECHNIQUE]: DeleteControlTechniqueMutation,
};

export default mutationMap;
