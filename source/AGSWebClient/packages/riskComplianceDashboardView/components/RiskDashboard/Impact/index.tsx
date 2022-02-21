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
import { FunctionComponent, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { NORTHSTAR_COLORS } from 'aws-northstar/themes';
import { RadialBarChart, RadialBar, PolarGrid, Tooltip } from 'recharts';
import DashboardCard from '@ags/webclient-core/components/DashboardCard';
import { ROUTE_RISKS_V2_VIEW } from '@ags/webclient-risks-core/config/routes';

const ALL_RISKS = 'ALL_RISKS';

export interface RiskImpact {
    name: string;
    count: number;
}

const mockData: RiskImpact[] = [
    {
        name: 'LEGAL',
        count: 10,
    },
    {
        name: 'FINANCIAL',
        count: 20,
    },
    {
        name: 'REPUTIONAL',
        count: 25,
    },
    {
        name: 'TECHNICAL',
        count: 5,
    },
];

const COLORS_MAPPING: { [name: string]: string } = {
    TECHNICAL: NORTHSTAR_COLORS.GREEN,
    LEGAL: NORTHSTAR_COLORS.ORANGE,
    FINANCIAL: NORTHSTAR_COLORS.BLUE,
    REPUTIONAL: NORTHSTAR_COLORS.RED,
    [ALL_RISKS]: NORTHSTAR_COLORS.GREY_50,
};

const LABEL_MAPPING: { [name: string]: string } = {
    LEGAL: 'L',
    TECHNICAL: 'T',
    FINANCIAL: 'F',
    REPUTIONAL: 'R',
    [ALL_RISKS]: '',
};

const TOOLTIP_LABEL_MAPPING: { [name: string]: string } = {
    LEGAL: 'Legal',
    TECHNICAL: 'Technical',
    FINANCIAL: 'Financial',
    REPUTIONAL: 'Reputional',
    ALL_RISKS: 'All',
};

const RiskImpactDashboard: FunctionComponent = () => {
    const history = useHistory();
    const handleClick = useCallback(
        (data) => {
            history.push(
                `${ROUTE_RISKS_V2_VIEW}?entityType=BUSINESS_UNIT&entityId=1&impactType=${data.name}`
            );
        },
        [history]
    );
    const data = useMemo(() => {
        return [
            ...mockData,
            {
                name: ALL_RISKS,
                count: mockData.reduce((total, i) => total + i.count, 0),
            },
        ].map((d) => ({
            ...d,
            fill: COLORS_MAPPING[d.name] || NORTHSTAR_COLORS.GREY_50,
            label: `${LABEL_MAPPING[d.name]}`,
        }));
    }, []);

    const renderTooltip = useCallback(({ active, payload }) => {
        if (active && payload && payload.length && payload[0].payload) {
            const item = payload[0].payload;
            if (item.name === ALL_RISKS) {
                return `${item.count} risks in total`;
            }

            return `${item.count} risks have ${
                TOOLTIP_LABEL_MAPPING[item.name] || 'Other'
            } impact`;
        }

        return null;
    }, []);
    return (
        <DashboardCard title="Risk Impacts">
            <RadialBarChart
                width={300}
                height={300}
                cx="50%"
                cy="50%"
                data={data}
                innerRadius="10%"
                outerRadius="80%"
                startAngle={180}
                endAngle={-180}
            >
                <PolarGrid />
                <Tooltip content={renderTooltip} />
                <RadialBar
                    background
                    dataKey="count"
                    label={{
                        dataKey: 'label',
                        position: 'bottom',
                        fill: NORTHSTAR_COLORS.GREY_900,
                    }}
                    onClick={handleClick}
                    cursor="pointer"
                ></RadialBar>
            </RadialBarChart>
        </DashboardCard>
    );
};

export default RiskImpactDashboard;
