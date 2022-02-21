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
import { Column } from 'aws-northstar/components/Table';
import { ComplianceStatusSummary } from '@ags/webclient-compliance-core/types';
import Button from 'aws-northstar/components/Button';
import Box from 'aws-northstar/layouts/Box';
import { tableTitleMapping, columnNameMapping } from '../../../constants';
import { DataClickEventHandler } from '../../../types';
import ComplianceLevel from '../../../ComplianceLevel';

const getComplianceStatusColumnDefinition = (
    entityType: string,
    onClick: DataClickEventHandler,
    getDisplayName: (data: ComplianceStatusSummary) => string
) => {
    const columnDefinition: Column<ComplianceStatusSummary>[] = [
        {
            id: 'id',
            width: 320,
            Header: columnNameMapping[entityType] || 'Name',
            accessor: getDisplayName,
            Cell: ({ row, value }: any) => {
                const data = row.original as ComplianceStatusSummary;
                return (
                    <Button
                        variant="link"
                        onClick={() =>
                            onClick(
                                [...data.nonCompliantList, ...data.compliantList],
                                'RUNTIME',
                                `${tableTitleMapping[entityType]} ${value} Compliance Posture`
                            )
                        }
                    >
                        {value}
                    </Button>
                );
            },
        },
        {
            id: 'complianceLevel',
            width: 200,
            Header: 'Compliance Level',
            accessor: (data) => {
                const countCompliant = data.compliantList?.length || 0;
                const countNoncompliant = data.nonCompliantList?.length || 0;
                if (countCompliant === 0 && countNoncompliant === 0) {
                    return <Box mx={2}>-</Box>;
                }

                return (
                    <Box>
                        <ComplianceLevel
                            level={
                                (countCompliant / (countNoncompliant + countCompliant)) *
                                100
                            }
                        />
                    </Box>
                );
            },
        },
        {
            id: 'compliantList',
            width: 150,
            Header: '# Compliant',
            accessor: (data) => {
                const countCompliant = data.compliantList?.length || 0;
                const countNoncompliant = data.nonCompliantList?.length || 0;
                return countCompliant === 0 && countNoncompliant === 0
                    ? '-'
                    : countCompliant;
            },
            Cell: ({ row, value }: any) => {
                const data = row.original as ComplianceStatusSummary;
                return value === '-' ? (
                    <Box ml={3}>{value}</Box>
                ) : (
                    <Button
                        variant="link"
                        onClick={() =>
                            onClick(
                                [...data.compliantList],
                                'RUNTIME',
                                `${tableTitleMapping[entityType]} ${getDisplayName(
                                    data
                                )} Compliant List`
                            )
                        }
                    >
                        {value}
                    </Button>
                );
            },
        },
        {
            id: 'nonCompliantList',
            width: 150,
            Header: '# Non-compliant',
            accessor: (data) => {
                const countCompliant = data.compliantList?.length || 0;
                const countNoncompliant = data.nonCompliantList?.length || 0;
                return countCompliant === 0 && countNoncompliant === 0
                    ? '-'
                    : countNoncompliant;
            },
            Cell: ({ row, value }: any) => {
                const data = row.original as ComplianceStatusSummary;
                return value === '-' ? (
                    <Box ml={3}>{value}</Box>
                ) : (
                    <Button
                        variant="link"
                        onClick={() =>
                            onClick(
                                [...data.nonCompliantList],
                                'RUNTIME',
                                `${tableTitleMapping[entityType]} ${getDisplayName(
                                    data
                                )} Non-compliant List`
                            )
                        }
                    >
                        {value}
                    </Button>
                );
            },
        },
    ];

    return columnDefinition;
};

export default getComplianceStatusColumnDefinition;
