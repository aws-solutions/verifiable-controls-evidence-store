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
import { FunctionComponent, useMemo } from 'react';
import { HeatmapDataType } from '@ags/webclient-core/components/Heatmap';
import InputHeatMap from '../ImpactHeatmap';
import Tabs from 'aws-northstar/components/Tabs';

const mockData: HeatmapDataType[] = [
    {
        row: 'VERY_HIGH',
        column: 'VERY_HIGH',
        value: 5,
        displayValue: 1,
    },
    {
        row: 'VERY_HIGH',
        column: 'HIGH',
        value: 5,
        displayValue: 3,
    },
    {
        row: 'VERY_HIGH',
        column: 'MODERATE',
        value: 5,
        displayValue: 2,
    },
    {
        row: 'VERY_HIGH',
        column: 'LOW',
        value: 4,
        displayValue: 2,
    },
    {
        row: 'VERY_HIGH',
        column: 'VERY_LOW',
        value: 3,
        displayValue: 1,
    },
    {
        row: 'HIGH',
        column: 'VERY_HIGH',
        value: 5,
        displayValue: 3,
    },
    {
        row: 'HIGH',
        column: 'HIGH',
        value: 5,
        displayValue: 3,
    },
    {
        row: 'HIGH',
        column: 'MODERATE',
        value: 4,
        displayValue: 3,
    },
    {
        row: 'HIGH',
        column: 'LOW',
        value: 3,
        displayValue: 3,
    },
    {
        row: 'HIGH',
        column: 'VERY_LOW',
        value: 2,
        displayValue: 3,
    },
    {
        row: 'MODERATE',
        column: 'VERY_HIGH',
        value: 5,
        displayValue: 3,
    },
    {
        row: 'MODERATE',
        column: 'HIGH',
        value: 4,
        displayValue: 3,
    },
    {
        row: 'MODERATE',
        column: 'MODERATE',
        value: 3,
        displayValue: 3,
    },
    {
        row: 'MODERATE',
        column: 'LOW',
        value: 2,
        displayValue: 3,
    },
    {
        row: 'MODERATE',
        column: 'VERY_LOW',
        value: 1,
        displayValue: 3,
    },
    {
        row: 'LOW',
        column: 'VERY_HIGH',
        value: 4,
        displayValue: 10,
    },
    {
        row: 'LOW',
        column: 'HIGH',
        value: 3,
        displayValue: 5,
    },
    {
        row: 'LOW',
        column: 'MODERATE',
        value: 2,
        displayValue: 3,
    },
    {
        row: 'LOW',
        column: 'LOW',
        value: 1,
        displayValue: 3,
    },
    {
        row: 'LOW',
        column: 'VERY_LOW',
        value: 1,
        displayValue: 3,
    },
    {
        row: 'VERY_LOW',
        column: 'VERY_HIGH',
        value: 3,
        displayValue: 1,
    },
    {
        row: 'VERY_LOW',
        column: 'HIGH',
        value: 2,
        displayValue: 2,
    },
    {
        row: 'VERY_LOW',
        column: 'MODERATE',
        value: 1,
        displayValue: 2,
    },
    {
        row: 'VERY_LOW',
        column: 'LOW',
        value: 1,
        displayValue: 3,
    },
    {
        row: 'VERY_LOW',
        column: 'VERY_LOW',
        value: 1,
        displayValue: 3,
    },
];

const commonProps = {
    entityType: 'BUSINESS_UNIT',
    entityId: '1',
};

const ImpactHeatmaps: FunctionComponent = () => {
    const reputationalImpact = useMemo(
        () => <InputHeatMap {...commonProps} data={mockData} impactType="REPUTIONAL" />,
        []
    );

    const financialImpact = useMemo(
        () => <InputHeatMap {...commonProps} data={mockData} impactType="FINANCIAL" />,
        []
    );

    const technicalImpact = useMemo(
        () => <InputHeatMap {...commonProps} data={mockData} impactType="TECHNICAL" />,
        []
    );

    const legalImpact = useMemo(
        () => <InputHeatMap {...commonProps} data={mockData} impactType="LEGAL" />,
        []
    );

    const tabs = useMemo(
        () => [
            {
                label: 'Reputational Impact',
                id: 'reputational',
                content: reputationalImpact,
            },
            {
                label: 'Financial Impact',
                id: 'financial',
                content: financialImpact,
            },
            {
                label: 'Legal Impact',
                id: 'legal',
                content: legalImpact,
            },
            {
                label: 'Technical Impact',
                id: 'technical',
                content: technicalImpact,
            },
        ],
        [reputationalImpact, financialImpact, technicalImpact, legalImpact]
    );

    return <Tabs tabs={tabs} variant="container" paddingContentArea={false} />;
};

export default ImpactHeatmaps;
