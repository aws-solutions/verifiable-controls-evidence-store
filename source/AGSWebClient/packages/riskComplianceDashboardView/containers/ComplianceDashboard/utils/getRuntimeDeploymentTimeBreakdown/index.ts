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

const getRuntimeDeploymentTimeBreakdown = (
    data?: CompliancePosture[]
): {
    deploymentTime: ComplianceStatusSummary;
    runtime: ComplianceStatusSummary;
} => {
    const breakdown: {
        deploymentTime: ComplianceStatusSummary;
        runtime: ComplianceStatusSummary;
    } = {
        deploymentTime: {
            id: 'deploymentTime',
            compliantList: [],
            nonCompliantList: [],
        },
        runtime: {
            id: 'runtime',
            compliantList: [],
            nonCompliantList: [],
        },
    };

    data?.forEach((d) => {
        if (d.deploymentStatus === COMPLIANT) {
            breakdown.deploymentTime.compliantList.push(d);
        } else if (d.deploymentStatus === NON_COMPLIANT) {
            breakdown.deploymentTime.nonCompliantList.push(d);
        }

        if (d.runtimeStatus === COMPLIANT) {
            breakdown.runtime.compliantList.push(d);
        } else if (d.runtimeStatus === NON_COMPLIANT) {
            breakdown.runtime.nonCompliantList.push(d);
        }
    });

    return breakdown;
};

export default getRuntimeDeploymentTimeBreakdown;
