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
    COMPLIANT,
    NON_COMPLIANT,
} from '@ags/webclient-compliance-core/types';

const processData = (
    data: CompliancePosture[]
): {
    businessUnits: ComplianceStatusSummary[];
    estates: ComplianceStatusSummary[];
    applications: ComplianceStatusSummary[];
    environments: ComplianceStatusSummary[];
} => {
    // Keep the data related to each domain in the map
    const businessUnits = {};
    const estates = {};
    const applications = {};
    const environments = {};

    data.forEach((d) => {
        addToList(businessUnits, d, d.businessUnitId);
        addToList(estates, d, d.estateId);
        addToList(applications, d, d.applicationId);
        addToList(environments, d, d.environmentId);
    });

    return {
        businessUnits: Object.values(businessUnits),
        estates: Object.values(estates),
        applications: Object.values(applications),
        environments: Object.values(environments),
    };
};

const addToList = (
    map: { [id: string]: ComplianceStatusSummary },
    data: CompliancePosture,
    id: string
) => {
    const summary = getSummaryById(map, id);
    if (data.runtimeStatus === COMPLIANT) {
        summary.compliantList.push(data);
    } else if (data.runtimeStatus === NON_COMPLIANT) {
        summary.nonCompliantList.push(data);
    }
};

const getSummaryById = (map: { [id: string]: ComplianceStatusSummary }, id: string) => {
    if (map[id]) {
        return map[id];
    }

    map[id] = {
        id,
        compliantList: [],
        nonCompliantList: [],
    };

    return map[id];
};

export default processData;
