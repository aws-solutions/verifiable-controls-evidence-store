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
import { FunctionComponent, useMemo, useCallback } from 'react';
import Tabs from 'aws-northstar/components/Tabs';
import Heading from 'aws-northstar/components/Heading';
import Box from 'aws-northstar/layouts/Box';
import Container from 'aws-northstar/layouts/Container';
import { ComplianceStatusSummary } from '@ags/webclient-compliance-core/types';
import {
    ComplianceDataType,
    DataClickEventHandler,
    EntityMaps,
    BusinessUnitComplianceStatusSummary,
} from '../types';
import GovernedEntityComplianceStatus from './components/GovernedEntity';

export interface RuntimeComplianceStatusProps {
    onDataClick: DataClickEventHandler;
    complianceData: ComplianceDataType;
    businessUnitsComplianceData: BusinessUnitComplianceStatusSummary[];
    entityMaps: EntityMaps;
    entityType: string;
}

const RuntimeComplianceStatus: FunctionComponent<RuntimeComplianceStatusProps> = ({
    onDataClick,
    complianceData,
    businessUnitsComplianceData,
    entityMaps: { businessUnitsMap, estatesMap, applicationsMap, environmentsMap },
    entityType,
}) => {
    const getBusinessUnitDisplayName = useCallback(
        (data: ComplianceStatusSummary) => {
            return businessUnitsMap?.[data.id]?.name || data.id;
        },
        [businessUnitsMap]
    );

    const getEstateDisplayName = useCallback(
        (data: ComplianceStatusSummary) => {
            return estatesMap?.[data.id]?.name || data.id;
        },
        [estatesMap]
    );

    const getApplicationDisplayName = useCallback(
        (data: ComplianceStatusSummary) => {
            return applicationsMap?.[data.id]?.name || data.id;
        },
        [applicationsMap]
    );

    const getEnvironmentDisplayName = useCallback(
        (data: ComplianceStatusSummary) => {
            const environment = environmentsMap?.[data.id];
            if (environment) {
                const estate = estatesMap?.[environment.estateId];
                return `${estate.name} - ${environment.name}`;
            }
            return data.id;
        },
        [environmentsMap, estatesMap]
    );

    const businessUnitComplianceStatus = useMemo(
        () =>
            entityType === 'BUSINESS_UNIT' && (
                <GovernedEntityComplianceStatus
                    data={businessUnitsComplianceData}
                    entityType="BUSINESS_UNIT"
                    onClick={onDataClick}
                    getDisplayName={getBusinessUnitDisplayName}
                />
            ),
        [businessUnitsComplianceData, onDataClick, getBusinessUnitDisplayName, entityType]
    );

    const estatesComplianceStatus = useMemo(
        () =>
            entityType === 'BUSINESS_UNIT' && (
                <GovernedEntityComplianceStatus
                    data={complianceData?.estates || []}
                    entityType="ESTATE"
                    onClick={onDataClick}
                    getDisplayName={getEstateDisplayName}
                />
            ),
        [complianceData.estates, onDataClick, getEstateDisplayName, entityType]
    );

    const applicationsComplianceStatus = useMemo(
        () => (
            <GovernedEntityComplianceStatus
                data={complianceData?.applications || []}
                entityType="APPLICATION"
                onClick={onDataClick}
                getDisplayName={getApplicationDisplayName}
            />
        ),
        [complianceData?.applications, onDataClick, getApplicationDisplayName]
    );

    const environmentsComplianceStatus = useMemo(
        () => (
            <GovernedEntityComplianceStatus
                data={complianceData?.environments || []}
                entityType="ENVIRONMENT"
                onClick={onDataClick}
                getDisplayName={getEnvironmentDisplayName}
            />
        ),
        [complianceData?.environments, onDataClick, getEnvironmentDisplayName]
    );

    const tabs = useMemo(() => {
        const tabs =
            entityType === 'BUSINESS_UNIT'
                ? [
                      {
                          label: `Business Units (${
                              complianceData?.businessUnits?.length || 0
                          })`,
                          id: 'businessUnits',
                          content: businessUnitComplianceStatus,
                      },
                      {
                          label: `Estates (${complianceData?.estates?.length || 0})`,
                          id: 'estates',
                          content: estatesComplianceStatus,
                      },
                  ]
                : [];

        return [
            ...tabs,
            {
                label: `Applications (${complianceData?.applications?.length || 0})`,
                id: 'applications',
                content: applicationsComplianceStatus,
            },
            {
                label: `Environments (${complianceData?.environments?.length || 0})`,
                id: 'environments',
                content: environmentsComplianceStatus,
            },
        ];
    }, [
        complianceData,
        businessUnitComplianceStatus,
        estatesComplianceStatus,
        applicationsComplianceStatus,
        environmentsComplianceStatus,
        entityType,
    ]);

    return (
        <Container
            headerContent={
                <Heading variant="h3">
                    Compliance Status Breakdown - Active Applications
                </Heading>
            }
            gutters={false}
        >
            <Box mb={-2}>
                <Tabs variant="container" tabs={tabs} paddingContentArea={false} />
            </Box>
        </Container>
    );
};

export default RuntimeComplianceStatus;
