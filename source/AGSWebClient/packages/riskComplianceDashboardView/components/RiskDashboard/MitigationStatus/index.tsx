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
import { FunctionComponent, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import DashboardCard from '@ags/webclient-core/components/DashboardCard';
import { NORTHSTAR_COLORS } from 'aws-northstar/themes';
import { useHistory } from 'react-router-dom';
import { ROUTE_RISKS_V2_VIEW } from '@ags/webclient-risks-core/config/routes';

export interface RiskMitigationStatus {
    name: string;
    count: number;
}

const mockData: RiskMitigationStatus[] = [
    {
        name: 'MITIGATED',
        count: 10,
    },
    {
        name: 'PARTIALLY_MITIGATED',
        count: 10,
    },
    {
        name: 'ACCEPTED_WITHOUT_MITIGATION',
        count: 5,
    },
    {
        name: 'ACCEPTED_WITH_MITIGATION',
        count: 4,
    },
    {
        name: 'NOT_MITIGATED',
        count: 6,
    },
];

const COLORS_MAPPING: { [name: string]: string } = {
    MITIGATED: NORTHSTAR_COLORS.GREEN,
    PARTIALLY_MITIGATED: NORTHSTAR_COLORS.BLUE,
    NOT_MITIGATED: NORTHSTAR_COLORS.RED,
    ACCEPTED_WITHOUT_MITIGATION: NORTHSTAR_COLORS.CHARCOAL,
    ACCEPTED_WITH_MITIGATION: NORTHSTAR_COLORS.ORANGE,
};

const LABEL_MAPPING: { [name: string]: string } = {
    MITIGATED: 'Mitigated',
    PARTIALLY_MITIGATED: 'Par. mtgt',
    NOT_MITIGATED: 'Not mtgt',
    ACCEPTED_WITHOUT_MITIGATION: 'Acpt w/o mtgn',
    ACCEPTED_WITH_MITIGATION: 'Acpt w mtgn',
};

const TOOLTIP_LABEL_MAPPING: { [name: string]: string } = {
    MITIGATED: 'Mitigated',
    PARTIALLY_MITIGATED: 'Partially Mitigated',
    NOT_MITIGATED: 'Not Mitigated',
    ACCEPTED_WITHOUT_MITIGATION: 'Accepted without Mitigation',
    ACCEPTED_WITH_MITIGATION: 'Accepted with Mitigation',
};

export interface RiskMitigationStatusDashboardProps {
    title?: string;
    subtitle?: string;
    width?: number;
    height?: number;
    onResetClick?: () => void;
}

const RiskMitigationStatusDashboard: FunctionComponent<RiskMitigationStatusDashboardProps> =
    ({
        title = 'Risk Mitigation',
        subtitle,
        onResetClick,
        width = 360,
        height = 300,
    }) => {
        const history = useHistory();
        const handleClick = useCallback(
            (name: string) => {
                history.push(
                    `${ROUTE_RISKS_V2_VIEW}?entityType=BUSINESS_UNIT&entityId=1&status=${name}`
                );
            },
            [history]
        );
        const renderLabel = useCallback(({ index }) => {
            const status = mockData[index].name;
            return `${mockData[index].count} - ${LABEL_MAPPING[status] || 'Others'}`;
        }, []);

        const renderTooltip = useCallback(({ active, payload }) => {
            if (active && payload && payload.length && payload[0].payload) {
                const item = payload[0].payload;
                return `${item.count} risks are ${
                    TOOLTIP_LABEL_MAPPING[item.name] || 'Others'
                }`;
            }

            return null;
        }, []);

        return (
            <DashboardCard title={title} subtitle={subtitle} onResetClick={onResetClick}>
                <PieChart width={width} height={height}>
                    <Tooltip content={renderTooltip} />
                    <Pie
                        data={mockData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={renderLabel}
                        dataKey="count"
                    >
                        {mockData.map((entry) => (
                            <Cell
                                key={`Cell-${entry.name}`}
                                fill={
                                    COLORS_MAPPING[entry.name] || NORTHSTAR_COLORS.GREY_50
                                }
                                onClick={() => handleClick(entry.name)}
                                cursor="pointer"
                            />
                        ))}
                    </Pie>
                </PieChart>
            </DashboardCard>
        );
    };

export default RiskMitigationStatusDashboard;
