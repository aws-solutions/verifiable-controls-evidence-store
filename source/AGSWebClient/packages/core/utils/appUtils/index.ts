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
import { ApiEndpoints } from '../../types';
import { DEFAULT_APP_HEADER } from '../../config/constants';

// TODO: Need to finalise the names
const appHeaderNames = [
    DEFAULT_APP_HEADER, // 0: None
    'Verifiable Evidence Store', // 1: Evidence only
    'Governed Application Release Manegement', // 2: Application Release only
    'Evidence and Application Management', // 3: Evidence + Application/Release
    'AWS Risk Management', // 4: Risk Management only
    'Risk and Evidence Management', // 5: Risk + Evidence
    'Risk and Application Management', // 6: Risk + App
    'AWS Governance Suite', // 7: Evidence + Risk + App
    'AWS Governance Suite', // 8: Compliance only
    'AWS Governance Suite', // 9: Compliance + Evidence
    'AWS Governance Suite', // 10: Compliance + App Release
    'AWS Governance Suite', // 11: Compliance + Evidence + App Relase
    'AWS Governance Suite', // 12: Compliance + Risk
    'AWS Governance Suite', // 13: Compliance + Risk + Evidence
    'AWS Governance Suite', // 14: Compliance + Risk + Application
    'AWS Governance Suite', // 15: Compliance + Risk + Evidence + App Release (Full suite)
];

const checkApiEndpoints = (apiEndpoints: ApiEndpoints): boolean =>
    apiEndpoints && Object.keys(apiEndpoints).length > 0;

const getNameIndex = (apiEndpoints: ApiEndpoints): number => {
    const bit0 = !!apiEndpoints['AGSEvidenceStore'];
    const bit1 =
        !!apiEndpoints['AGSApplicationDefinitionService'] &&
        !!apiEndpoints['AGSReleaseManagementService'];
    const bit2 =
        !!apiEndpoints['AGSRiskManagementService'] &&
        !!apiEndpoints['AGSEstateManagementService'];
    const bit3 = !!apiEndpoints['AGSComplianceEvaluatorService'];

    return (bit3 ? 8 : 0) + (bit2 ? 4 : 0) + (bit1 ? 2 : 0) + (bit0 ? 1 : 0);
};

export const getAppHeader = (apiEndpoints: ApiEndpoints) => {
    if (!checkApiEndpoints(apiEndpoints)) {
        return DEFAULT_APP_HEADER;
    } else {
        return appHeaderNames[getNameIndex(apiEndpoints)];
    }
};

export const getNavHeader = (apiEndpoints: ApiEndpoints) => {
    return getAppHeader(apiEndpoints);
};

export const getHtmlPageHeader = (apiEndpoints: ApiEndpoints) => {
    return getAppHeader(apiEndpoints);
};

const homePageRoutes: (string | undefined)[] = [
    undefined, // 0: None
    '/evidences', // 1: Evidence only
    '/applications', // 2: Application Release only
    '/applications', // 3: Evidence + Application/Release
    '/enterprise', // 4: Risk Management only
    '/enterprise', // 5: Risk + Evidence
    '/enterprise', // 6: Risk + App
    '/enterprise', // 7: Evidence + Risk + App
    undefined, // 8: Compliance only
    '/evidences', // 9: Compliance + Evidence
    '/applications', // 10: Compliance + App Release
    '/applications', // 11: Compliance + Evidence + App Relase
    '/enterprise', // 12: Compliance + Risk
    '/enterprise', // 13: Compliance + Risk + Evidence
    '/enterprise', // 14: Compliance + Risk + Application
    '/enterprise', // 15: Compliance + Risk + Evidence + App Release (Full suite)
];

export const getHomePageRoute = (apiEndpoints: ApiEndpoints): string | undefined => {
    if (!checkApiEndpoints(apiEndpoints)) {
        return undefined;
    }
    return homePageRoutes[getNameIndex(apiEndpoints)];
};
