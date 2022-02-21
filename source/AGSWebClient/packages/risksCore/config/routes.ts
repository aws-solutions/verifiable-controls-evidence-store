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

// Risks
export const ROUTE_RISK_CREATE = '/risks/create';
export const ROUTE_RISKS_VIEW = '/risks';
export const ROUTE_RISK_DETAILS = '/risks/:riskId';
export const ROUTE_RISK_UPDATE = '/risks/:riskId/update';

// Risks V2
export const ROUTE_RISK_V2_CREATE = '/risksv2/create';
export const ROUTE_RISKS_V2_VIEW = '/risksv2';
export const ROUTE_RISK_V2_DETAILS = '/risksv2/:riskId';
export const ROUTE_RISK_V2_UPDATE = '/risksv2/:riskId/update';

// Control Objectives
export const ROUTE_CONTROL_OBJECTIVE_CREATE = '/controlobjectives/create';
export const ROUTE_CONTROL_OBJECTIVES_VIEW = '/controlobjectives';
export const ROUTE_CONTROL_OBJECTIVE_DETAILS = '/controlobjectives/:controlObjectiveId';
export const ROUTE_CONTROL_OBJECTIVE_UPDATE =
    '/controlobjectives/:controlObjectiveId/update';

// Control Techniques
export const ROUTE_CONTROL_TECHNIQUE_CREATE = '/controltechniques/create';
export const ROUTE_CONTROL_TECHNIQUES_VIEW = '/controltechniques';
export const ROUTE_CONTROL_TECHNIQUE_DETAILS = '/controltechniques/:controlTechniqueId';
export const ROUTE_CONTROL_TECHNIQUE_UPDATE =
    '/controltechniques/:controlTechniqueId/update';

export const ROUTE_GOVERNED_ENTITIES_VIEW = '/governedentities';
export const ROUTE_GOVERNED_ENTITY_UPDATE =
    '/governedentities/:entityType/:entityId/update';
