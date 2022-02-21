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
import { FunctionComponent, useEffect } from 'react';
import * as d3 from 'd3';
import { NORTHSTAR_COLORS } from 'aws-northstar/themes';

/* istanbul ignore */

export interface HeatmapDataType {
    /** The row type */
    row: string;
    /** The column type */
    column: string;
    /** The heat value */
    value: number;
    /** The value displayed in the tile */
    displayValue?: string | number;
}

export interface HeatmapProps {
    /** The data */
    data: HeatmapDataType[];
    /** All the row types. */
    rows: string[];
    /** All the column types */
    columns: string[];
    /** The control Id */
    controlId: string;
    /** The min value of the heat */
    minValue: number;
    /** The max value of the heat */
    maxValue: number;
    /** The label for X axis */
    xLabel: string;
    /** The table for Y axis */
    yLabel: string;
    /** The width of the heatmap */
    width: number;
    /** The height of the heatmap */
    height: number;
    /** The click handler */
    onClick?: (data: HeatmapDataType) => void;
    /** The double click handler */
    onDblClick?: (data: HeatmapDataType) => void;
    /** The mouseenter handler */
    onMouseEnter?: (data: HeatmapDataType) => void;
    /** The mouseleave handler */
    onMouseLeave?: (data: HeatmapDataType) => void;
    /** The margin top of the heatmap */
    marginTop?: number;
    /** The margin bottom of the heatmap */
    marginBottom?: number;
    /** The margin left of the heatmap */
    marginLeft?: number;
    /** The margin right of the heatmap */
    marginRight?: number;
}

const renderHeatmap = ({
    data,
    controlId,
    rows,
    columns,
    minValue,
    maxValue,
    xLabel,
    yLabel,
    width,
    height,
    marginTop = 0,
    marginBottom = 50,
    marginLeft = 120,
    marginRight = 100,
    onClick,
    onDblClick,
    onMouseEnter,
    onMouseLeave,
}: HeatmapProps) => {
    const querySelector = `#${controlId}`;
    const margin = {
        top: marginTop,
        right: marginRight,
        bottom: marginBottom,
        left: marginLeft,
    };
    const calcWidth = width - margin.left - margin.right;
    const calcHeight = height - margin.top - margin.bottom;

    // Clean the existing svg
    d3.select(querySelector).html('');

    const svg = d3
        .select(querySelector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Build X scales and axis:
    const x = d3.scaleBand().range([0, calcWidth]).domain(rows).padding(0.05);

    svg.append('g')
        .style('font-size', 12)
        .attr('transform', 'translate(0,' + calcHeight + ')')
        .call(d3.axisBottom(x).tickSize(0))
        .select('.domain')
        .remove();

    // Build Y scales and axis:
    const y = d3.scaleBand().range([calcHeight, 0]).domain(columns).padding(0.05);
    svg.append('g')
        .style('font-size', 12)
        .call(d3.axisLeft(y).tickSize(0))
        .select('.domain')
        .remove();

    const colors = d3
        .scaleSequential()
        .interpolator(d3.interpolateInferno)
        .domain([minValue, maxValue]);

    const mouseenter = function (_event: any, d: HeatmapDataType) {
        onMouseEnter?.(d);

        //@ts-ignore
        const handler = d3.select(this).style('stroke', 'black').style('opacity', 1);

        if (onClick) {
            handler.style('cursor', 'pointer');
        }
    };

    const mouseleave = function (_event: any, d: HeatmapDataType) {
        //@ts-ignore
        d3.select(this)
            .style('stroke', 'none')
            .style('opacity', 0.8)
            .style('cursor', 'default');

        onMouseLeave?.(d);
    };

    const click = (_event: any, d: HeatmapDataType) => {
        onClick?.(d);
    };

    const dblclick = (_event: any, d: HeatmapDataType) => {
        onDblClick?.(d);
    };

    const tiles = svg
        .selectAll()
        .data(data, (d) => {
            return d?.value || 0;
        })
        .enter();

    tiles
        .append('rect')
        // @ts-ignore
        .attr('x', (d) => x(d.row))
        // @ts-ignore
        .attr('y', (d) => y(d.column))
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', (d) => colors(maxValue + minValue - d.value))
        .style('stroke-width', 4)
        .style('stroke', 'none')
        .style('opacity', 0.8)
        .on('mouseleave', mouseleave)
        .on('mouseenter', mouseenter)
        .on('click', click)
        .on('dblclick', dblclick);

    tiles
        .append('text')
        .style('font-size', 12)
        .style('fill', NORTHSTAR_COLORS.CHARCOAL)
        .attr('text-anchor', 'middle')
        // @ts-ignore
        .attr('x', (d: HeatmapDataType) => x(d.row) + x.bandwidth() / 2)
        // @ts-ignore
        .attr('y', (d: HeatmapDataType) => y(d.column) + y.bandwidth() / 2)
        .attr('dy', '.4em')
        .text((d: any) => d?.displayValue || '');

    svg.append('text')
        .style('font-size', 14)
        .attr('text-anchor', 'middle')
        .attr('x', width / 2 - margin.left)
        .attr('y', height - 20)
        .text(xLabel);

    svg.append('text')
        .style('font-size', 14)
        .attr('text-anchor', 'end')
        .attr('x', -height / 2 + margin.bottom)
        .attr('y', -margin.left)
        .attr('dy', '.75em')
        .attr('transform', 'rotate(-90)')
        .text(yLabel);
};

const Heatmap: FunctionComponent<HeatmapProps> = (props) => {
    useEffect(() => {
        renderHeatmap(props);
    }, [props]);

    return <div id={props.controlId} />;
};

export default Heatmap;
