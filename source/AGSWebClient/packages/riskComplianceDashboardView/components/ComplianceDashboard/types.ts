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
import {
    CompliancePosture,
    ComplianceStatusSummary,
} from '@ags/webclient-compliance-core/types';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import { Application } from '@ags/webclient-applications-core/types';
import { Estate, Environment } from '@ags/webclient-estates-core/types';

export type DataClickEventHandler = (
    deploymentList: CompliancePosture[],
    type: 'RUNTIME' | 'DEPLOY',
    title: string
) => void;

export interface GovernedEntityComplianceStatusProps {
    data: ComplianceStatusSummary[];
    entityType: string;
    onClick: DataClickEventHandler;
    getDisplayName: (data: ComplianceStatusSummary) => string;
}

export interface ComplianceDataType {
    businessUnits: ComplianceStatusSummary[];
    estates: ComplianceStatusSummary[];
    applications: ComplianceStatusSummary[];
    environments: ComplianceStatusSummary[];
}

export type BusinessUnitComplianceStatusSummary = ComplianceStatusSummary & {
    subRows: BusinessUnitComplianceStatusSummary[];
};

export interface EntityMaps {
    businessUnitsMap: { [id: string]: BusinessUnitSummary };
    estatesMap: { [id: string]: Estate };
    applicationsMap: { [id: string]: Application };
    environmentsMap: { [id: string]: Environment };
}
