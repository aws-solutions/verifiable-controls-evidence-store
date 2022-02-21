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
import { CompliancePosture } from '@ags/webclient-compliance-core/types';
import processData from '.';

const sourceData: CompliancePosture[] = [
    {
        businessUnitId: 'BU_1',
        estateId: 'ES_1',
        applicationId: 'APP_1',
        environmentClass: 'DEV',
        environmentId: 'DEV',
        releaseId: 'RL_1',
        deploymentId: 'RL_1_DEV',
        deploymentStatus: 'COMPLIANT',
        runtimeStatus: 'COMPLIANT',
    },
    {
        businessUnitId: 'BU_1',
        estateId: 'ES_1',
        applicationId: 'APP_1',
        environmentClass: 'DEV',
        environmentId: 'DEV',
        releaseId: 'RL_1',
        deploymentId: 'RL_1_DEV',
        deploymentStatus: 'COMPLIANT',
        runtimeStatus: 'NON_COMPLIANT',
    },
    {
        businessUnitId: 'BU_2',
        estateId: 'ES_2',
        applicationId: 'APP_2',
        environmentClass: 'PROD',
        environmentId: 'PROD',
        releaseId: 'RL_2',
        deploymentId: 'RL_2_PROD',
        deploymentStatus: 'COMPLIANT',
        runtimeStatus: 'COMPLIANT',
    },
    {
        businessUnitId: 'BU_2',
        estateId: 'ES_2',
        applicationId: 'APP_2',
        environmentClass: 'PROD',
        environmentId: 'PROD',
        releaseId: 'RL_2',
        deploymentId: 'RL_2_PROD',
        deploymentStatus: 'COMPLIANT',
        runtimeStatus: 'NON_COMPLIANT',
    },
];

describe('processData', () => {
    it('aggregates the runtime compliance status for each business unit', () => {
        const result = processData(sourceData);
        expect(result.businessUnits).toHaveLength(2);
        expect(result.businessUnits[0].id).toBe('BU_1');
        expect(result.businessUnits[0].compliantList).toHaveLength(1);
        expect(result.businessUnits[0].nonCompliantList).toHaveLength(1);
        expect(result.businessUnits[1].id).toBe('BU_2');
        expect(result.businessUnits[1].compliantList).toHaveLength(1);
        expect(result.businessUnits[1].nonCompliantList).toHaveLength(1);
    });

    it('aggregates the runtime compliance status for each estate', () => {
        const result = processData(sourceData);
        expect(result.estates).toHaveLength(2);
        expect(result.estates[0].id).toBe('ES_1');
        expect(result.estates[0].compliantList).toHaveLength(1);
        expect(result.estates[0].nonCompliantList).toHaveLength(1);
        expect(result.estates[1].id).toBe('ES_2');
        expect(result.estates[1].compliantList).toHaveLength(1);
        expect(result.estates[1].nonCompliantList).toHaveLength(1);
    });

    it('aggregates the runtime compliance status for application breakdown', () => {
        const result = processData(sourceData);
        expect(result.applications).toHaveLength(2);
        expect(result.applications[0].id).toBe('APP_1');
        expect(result.applications[0].compliantList).toHaveLength(1);
        expect(result.applications[0].nonCompliantList).toHaveLength(1);
        expect(result.applications[1].id).toBe('APP_2');
        expect(result.applications[1].compliantList).toHaveLength(1);
        expect(result.applications[1].nonCompliantList).toHaveLength(1);
    });
});
