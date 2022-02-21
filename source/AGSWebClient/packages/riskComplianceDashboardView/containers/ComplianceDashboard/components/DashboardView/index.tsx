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
import { FunctionComponent, useCallback, useMemo, useEffect } from 'react';

import Stack from 'aws-northstar/layouts/Stack';
import Box from 'aws-northstar/layouts/Box';
import ColumnLayout from 'aws-northstar/layouts/ColumnLayout';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import ComplianceStatusBreakdown from '../../../../components/ComplianceDashboard/ComplianceStatusBreakdown';
import DeploymentList from '../../../../components/ComplianceDashboard/DeploymentList';
import { CompliancePosture } from '@ags/webclient-compliance-core/types';
import {
    ComplianceDataType,
    EntityMaps,
} from '../../../../components/ComplianceDashboard/types';
import RuntimeComplianceStatus from '../../../../components/ComplianceDashboard/RuntimeComplianceStatus';
import getBusinessUnitsComplianceData from '../../utils/getBusinessUnitsComplianceData';
import getRuntimeDeploymentTimeBreakdown from '../../utils/getRuntimeDeploymentTimeBreakdown';

export interface DashboardViewProps {
    entityMaps: EntityMaps;
    complianceData: ComplianceDataType;
    rawData: CompliancePosture[];
    entityType: string;
    entityId: string;
}

const TITLE_DEPLOY_STATUS = 'Compliance Status - Historical Deployments';
const TITLE_RUNTIME_STATUS = 'Compliance Status - Active Applications';

const DashboardView: FunctionComponent<DashboardViewProps> = ({
    entityMaps,
    entityMaps: { businessUnitsMap, estatesMap, applicationsMap },
    complianceData,
    rawData,
    entityType,
    entityId,
}) => {
    const deploymentRunTimeBreakdownData = useMemo(() => {
        return getRuntimeDeploymentTimeBreakdown(rawData);
    }, [rawData]);

    const businessUnitsComplianceData = useMemo(() => {
        if (entityType === 'BUSINESS_UNIT' && entityId && complianceData?.businessUnits) {
            const nodeBusinessUnitsComplianceData = getBusinessUnitsComplianceData(
                entityId,
                Object.values(businessUnitsMap),
                complianceData?.businessUnits
            );
            if (nodeBusinessUnitsComplianceData) {
                return [nodeBusinessUnitsComplianceData];
            }
        }

        return [];
    }, [entityType, entityId, complianceData, businessUnitsMap]);

    const { openSplitPanel, setSplitPanelContent, setDefaultSplitPanelHeight } =
        useAppLayoutContext();

    const handleCompliancePostureClick = useCallback(
        (
            deploymentList: CompliancePosture[],
            type: 'RUNTIME' | 'DEPLOY',
            title: string
        ) => {
            const deploymentListTable = (
                <DeploymentList
                    data={deploymentList || []}
                    tableTitle={title}
                    type={type}
                    businessUnits={businessUnitsMap}
                    estates={estatesMap}
                    applications={applicationsMap}
                />
            );
            setSplitPanelContent(deploymentListTable);
            setDefaultSplitPanelHeight(360);
            openSplitPanel(true);
        },
        [
            businessUnitsMap,
            applicationsMap,
            estatesMap,
            openSplitPanel,
            setSplitPanelContent,
            setDefaultSplitPanelHeight,
        ]
    );

    useEffect(() => {
        return () => {
            openSplitPanel(false);
            setSplitPanelContent(undefined);
        };
    }, [openSplitPanel, setSplitPanelContent]);

    const handleDeploymentTimeComplianceDataClick = useCallback(
        (deploymentList: CompliancePosture[]) => {
            handleCompliancePostureClick(deploymentList, 'DEPLOY', TITLE_DEPLOY_STATUS);
        },
        [handleCompliancePostureClick]
    );

    const handleRuntimeComplianceDataClick = useCallback(
        (deploymentList: CompliancePosture[]) => {
            handleCompliancePostureClick(deploymentList, 'RUNTIME', TITLE_RUNTIME_STATUS);
        },
        [handleCompliancePostureClick]
    );

    return (
        <Stack>
            <ColumnLayout renderDivider={false}>
                <ComplianceStatusBreakdown
                    data={deploymentRunTimeBreakdownData.deploymentTime}
                    title={TITLE_DEPLOY_STATUS}
                    onClick={handleDeploymentTimeComplianceDataClick}
                />
                <ComplianceStatusBreakdown
                    data={deploymentRunTimeBreakdownData.runtime}
                    title={TITLE_RUNTIME_STATUS}
                    onClick={handleRuntimeComplianceDataClick}
                />
            </ColumnLayout>
            <Box width="100%">
                <RuntimeComplianceStatus
                    onDataClick={handleCompliancePostureClick}
                    complianceData={complianceData}
                    businessUnitsComplianceData={businessUnitsComplianceData}
                    entityMaps={entityMaps}
                    entityType={entityType}
                />
            </Box>
        </Stack>
    );
};

export default DashboardView;
