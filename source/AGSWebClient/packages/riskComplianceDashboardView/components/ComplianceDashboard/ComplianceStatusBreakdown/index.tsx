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
import { PieChart, Pie, Cell, Sector } from 'recharts';
import { NORTHSTAR_COLORS } from 'aws-northstar/themes';
import {
    CompliancePosture,
    ComplianceStatusSummary,
} from '@ags/webclient-compliance-core/types';
import DashboardCard from '@ags/webclient-core/components/DashboardCard';

export interface ComplianceStatusBreakdownProps {
    data: ComplianceStatusSummary;
    title: string;
    onClick: (deploymentList: CompliancePosture[]) => void;
}

const colorScheme = [
    {
        value: 20, // 20%
        color: NORTHSTAR_COLORS.RED_DARK,
    },
    {
        value: 20, // 40%
        color: NORTHSTAR_COLORS.RED,
    },
    {
        value: 20, // 60%
        color: NORTHSTAR_COLORS.ORANGE_DARK,
    },
    {
        value: 20, // 80%
        color: NORTHSTAR_COLORS.ORANGE,
    },
    {
        value: 20, // 100%
        color: NORTHSTAR_COLORS.GREEN_DARK,
    },
];

const sum = 100; // 100%
const width = 400;
const height = 150;

const ComplianceStatusBreakdown: FunctionComponent<ComplianceStatusBreakdownProps> = ({
    data,
    title,
    onClick,
}) => {
    const countCompliant = useMemo(() => data.compliantList?.length || 0, [data]);
    const countNonCompliant = useMemo(() => data.nonCompliantList?.length || 0, [data]);

    const value = useMemo(
        () => (countCompliant / (countCompliant + countNonCompliant)) * 100,
        [countCompliant, countNonCompliant]
    );

    const activeSectorIndex = (colorScheme as { value: number }[])
        .map((cur, index, arr) => {
            const curMax = [...arr]
                .splice(0, index + 1)
                .reduce((a, b) => ({ value: a.value + b.value })).value;
            return value > curMax - cur.value && value <= curMax;
        })
        .findIndex((cur) => cur);

    const arrowData = [{ value: value }, { value: 0 }, { value: sum - value }];

    const pieProps = {
        startAngle: 180,
        endAngle: 0,
        cx: width / 2,
        cy: height - 30,
    };

    const pieRadius = {
        innerRadius: (width / 2) * 0.4,
        outerRadius: (width / 2) * 0.5,
    };

    const Arrow = ({ cx, cy, midAngle, outerRadius }: any) => {
        const RADIAN = Math.PI / 180;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const mx = cx + (outerRadius + width * 0.03) * cos;
        const my = cy + (outerRadius + width * 0.03) * sin;
        return (
            <g>
                <circle
                    cx={cx}
                    cy={cy}
                    r={width * 0.05}
                    fill={NORTHSTAR_COLORS.GREY_600}
                    stroke="none"
                />
                <path
                    d={`M${cx},${cy}L${mx},${my}`}
                    strokeWidth="6"
                    stroke={NORTHSTAR_COLORS.GREY_600}
                    fill="none"
                    strokeLinecap="round"
                />
            </g>
        );
    };

    const ActiveSectorMark = ({
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        fill,
    }: any) => {
        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius * 1.1}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    cursor="pointer"
                    onClick={() => {
                        onClick([...data.nonCompliantList, ...data.compliantList]);
                    }}
                />
            </g>
        );
    };

    return (
        <DashboardCard
            title={title}
            subtitle={`${countCompliant}/${
                countCompliant + countNonCompliant
            } (${value.toFixed(2)}%) compliant`}
        >
            <PieChart width={width} height={height}>
                <Pie
                    activeIndex={activeSectorIndex}
                    activeShape={ActiveSectorMark}
                    data={colorScheme}
                    dataKey="value"
                    {...pieProps}
                    {...pieRadius}
                >
                    {colorScheme.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={colorScheme[index].color} />
                    ))}
                </Pie>
                <Pie
                    stroke="none"
                    activeIndex={1}
                    activeShape={Arrow}
                    data={arrowData}
                    dataKey="value"
                    outerRadius={pieRadius.innerRadius}
                    fill="none"
                    {...pieProps}
                />
            </PieChart>
        </DashboardCard>
    );
};

export default ComplianceStatusBreakdown;
