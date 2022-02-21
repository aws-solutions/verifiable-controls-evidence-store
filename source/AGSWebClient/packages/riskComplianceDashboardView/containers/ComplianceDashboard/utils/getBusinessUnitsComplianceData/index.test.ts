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
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import {
    CompliancePosture,
    ComplianceStatusSummary,
} from '@ags/webclient-compliance-core/types';
import getBusinessUntisComplianceData from '.';

const getComplianceStatusList = (num: number): CompliancePosture[] => {
    return Array.from(Array(num).keys()).map(() => ({
        businessUnitId: 'testBU',
        estateId: 'testEst',
        applicationId: 'testApp',
        releaseId: 'testRelease',
        environmentClass: 'testEnv',
        environmentId: 'testEnv',
    }));
};

describe('getBusinessUntisComplianceData', () => {
    test('generate organization tree with aggregated compliance status for single node', () => {
        const businessUnits: BusinessUnitSummary[] = [
            {
                id: 'BU_1',
                name: 'BU_1',
                parentId: '',
                unitType: 'BusinessUnit',
            },
        ];
        const sourceData: ComplianceStatusSummary[] = [
            {
                id: 'BU_1',
                compliantList: getComplianceStatusList(2),
                nonCompliantList: getComplianceStatusList(3),
            },
        ];

        const result = getBusinessUntisComplianceData('BU_1', businessUnits, sourceData);
        expect(result.id).toBe('BU_1');
        expect(result.subRows).toHaveLength(0);
        expect(result.compliantList).toHaveLength(2);
        expect(result.nonCompliantList).toHaveLength(3);
    });

    test('generate organization tree with aggregated compliance status for simple tree', () => {
        const businessUnits: BusinessUnitSummary[] = [
            {
                id: 'BU_1',
                name: 'BU_1',
                parentId: '',
                unitType: 'BusinessUnit',
            },
            {
                id: 'BU_2',
                parentId: 'BU_1',
                name: 'BU_2',
                unitType: 'BusinessUnit',
            },
            {
                id: 'BU_3',
                parentId: 'BU_1',
                name: 'BU_3',
                unitType: 'BusinessUnit',
            },
        ];

        const sourceData: ComplianceStatusSummary[] = [
            {
                id: 'BU_1',
                compliantList: getComplianceStatusList(2),
                nonCompliantList: getComplianceStatusList(3),
            },
            {
                id: 'BU_2',
                compliantList: getComplianceStatusList(3),
                nonCompliantList: getComplianceStatusList(4),
            },
            {
                id: 'BU_3',
                compliantList: getComplianceStatusList(4),
                nonCompliantList: getComplianceStatusList(5),
            },
        ];

        const result = getBusinessUntisComplianceData('BU_1', businessUnits, sourceData);
        expect(result.id).toBe('BU_1');
        expect(result.subRows).toHaveLength(2);
        expect(result.compliantList).toHaveLength(4 + 3 + 2);
        expect(result.nonCompliantList).toHaveLength(5 + 4 + 3);
    });

    test('generate organization tree with aggregated compliance status for 3 layer tree', () => {
        const businessUnits: BusinessUnitSummary[] = [
            {
                id: 'BU_1',
                name: 'BU_1',
                parentId: '',
                unitType: 'BusinessUnit',
            },
            {
                id: 'BU_2',
                parentId: 'BU_1',
                name: 'BU_2',
                unitType: 'BusinessUnit',
            },
            {
                id: 'BU_3',
                parentId: 'BU_1',
                name: 'BU_3',
                unitType: 'BusinessUnit',
            },
            {
                id: 'BU_4',
                parentId: 'BU_2',
                name: 'BU_4',
                unitType: 'BusinessUnit',
            },
            {
                id: 'BU_5',
                parentId: 'BU_2',
                name: 'BU_5',
                unitType: 'BusinessUnit',
            },
        ];

        const sourceData: ComplianceStatusSummary[] = [
            {
                id: 'BU_1',
                compliantList: getComplianceStatusList(2),
                nonCompliantList: getComplianceStatusList(3),
            },
            {
                id: 'BU_2',
                compliantList: getComplianceStatusList(3),
                nonCompliantList: getComplianceStatusList(4),
            },
            {
                id: 'BU_3',
                compliantList: getComplianceStatusList(4),
                nonCompliantList: getComplianceStatusList(5),
            },
            {
                id: 'BU_4',
                compliantList: getComplianceStatusList(5),
                nonCompliantList: getComplianceStatusList(6),
            },
            {
                id: 'BU_5',
                compliantList: getComplianceStatusList(6),
                nonCompliantList: getComplianceStatusList(7),
            },
        ];

        const result = getBusinessUntisComplianceData('BU_1', businessUnits, sourceData);
        expect(result.id).toBe('BU_1');
        expect(result.subRows).toHaveLength(2); //BU_1
        expect(result.compliantList).toHaveLength(2 + 3 + 4 + 5 + 6);
        expect(result.nonCompliantList).toHaveLength(3 + 4 + 5 + 6 + 7);
        expect(result.subRows[0].subRows).toHaveLength(2); //BU_2
    });
});
