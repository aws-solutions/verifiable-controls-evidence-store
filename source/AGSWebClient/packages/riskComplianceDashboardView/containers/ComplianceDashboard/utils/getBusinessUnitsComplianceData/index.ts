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
import { ComplianceStatusSummary } from '@ags/webclient-compliance-core/types';
import { BusinessUnitComplianceStatusSummary } from '../../../../components/ComplianceDashboard/types';

const getBusinesUnitsComplianceData = (
    nodeId: string,
    businessUnits: BusinessUnitSummary[],
    complianceData: ComplianceStatusSummary[]
): BusinessUnitComplianceStatusSummary => {
    const nodeData = complianceData.find((d) => d.id === nodeId) || {
        id: nodeId,
        compliantList: [],
        nonCompliantList: [],
    };

    const children = businessUnits.filter((bu) => bu.parentId === nodeId);

    const subRows: BusinessUnitComplianceStatusSummary[] = [];

    children.forEach((c) => {
        const childrenData = getBusinesUnitsComplianceData(
            c.id,
            businessUnits,
            complianceData
        );
        subRows.push(childrenData);
        nodeData.compliantList.push(...childrenData.compliantList);
        nodeData.nonCompliantList.push(...childrenData.nonCompliantList);
    });

    return {
        ...nodeData,
        subRows,
    };
};

export default getBusinesUnitsComplianceData;
