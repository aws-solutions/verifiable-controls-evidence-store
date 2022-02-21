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
import { useHistory } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { NORTHSTAR_COLORS } from 'aws-northstar/themes';
import DashboardCard from '@ags/webclient-core/components/DashboardCard';
import { ROUTE_RISKS_V2_VIEW } from '@ags/webclient-risks-core/config/routes';

export interface RiskCategory {
    name: string;
    count: number;
}

const mockData: RiskCategory[] = [
    {
        name: 'CYBERSECURITY',
        count: 50,
    },
    {
        name: 'GENERAL',
        count: 22,
    },
];

const COLORS_MAPPING: { [name: string]: string } = {
    CYBERSECURITY: NORTHSTAR_COLORS.ORANGE,
    GENERAL: NORTHSTAR_COLORS.BLUE,
};

const LABEL_MAPPING: { [name: string]: string } = {
    CYBERSECURITY: 'Cybersecurity',
    GENERAL: 'General',
};

const RiskCategoryDashboard: FunctionComponent = () => {
    const history = useHistory();
    const handleClick = useCallback(
        (name: string) => {
            history.push(
                `${ROUTE_RISKS_V2_VIEW}?entityType=BUSINESS_UNIT&entityId=1&category=${name}`
            );
        },
        [history]
    );
    const renderLabel = useCallback(({ index }) => {
        const category = mockData[index].name;
        return `${mockData[index].count} - ${LABEL_MAPPING[category] || 'Others'}`;
    }, []);

    const renderTooltip = useCallback(({ active, payload }) => {
        if (active && payload && payload.length && payload[0].payload) {
            const item = payload[0].payload;
            return `${item.count} risks are ${LABEL_MAPPING[item.name] || 'Others'} Risk`;
        }

        return null;
    }, []);
    return (
        <DashboardCard title="Risk Categories">
            <PieChart width={360} height={300}>
                <Tooltip content={renderTooltip} />
                <Pie
                    data={mockData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    label={renderLabel}
                    paddingAngle={5}
                    dataKey="count"
                >
                    {mockData.map((entry) => (
                        <Cell
                            key={`Cell-${entry.name}`}
                            onClick={() => handleClick(entry.name)}
                            cursor="pointer"
                            fill={COLORS_MAPPING[entry.name] || NORTHSTAR_COLORS.GREY_50}
                        />
                    ))}
                </Pie>
            </PieChart>
        </DashboardCard>
    );
};

export default RiskCategoryDashboard;
