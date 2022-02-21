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
import { FunctionComponent, useMemo, useState, useCallback, useEffect } from 'react';
import ExpandableSection from 'aws-northstar/components/ExpandableSection';
import FormRenderer, { componentTypes } from 'aws-northstar/components/FormRenderer';
import Box from 'aws-northstar/layouts/Box';
import Inline from 'aws-northstar/layouts/Inline';
import Badge from 'aws-northstar/components/Badge';

export interface RiskSearchData {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    status?: string;
    entityType?: string;
    entityId?: string;
    impactType?: string;
    impactSeverity?: string;
    impactLikelihood?: string;
}

export interface RiskSearchProps {
    initialSearchData?: RiskSearchData;
    onSearch: (searchData: RiskSearchData) => void;
    isSubmitting?: boolean;
}

const RiskSearch: FunctionComponent<RiskSearchProps> = ({
    initialSearchData,
    onSearch,
    isSubmitting,
}) => {
    const [expanded, setExpanded] = useState(false);
    const [searchData, setSearchData] = useState<RiskSearchData>(initialSearchData || {});

    useEffect(() => {
        onSearch?.(searchData);
    }, [searchData, onSearch]);

    const header = useMemo(() => {
        return (
            <Box>
                <Inline>
                    <>Search</>
                    {searchData.id && (
                        <Badge color="blue" content={`Id contains ${searchData.id}`} />
                    )}
                    {searchData.name && (
                        <Badge
                            color="blue"
                            content={`Name contains ${searchData.name}`}
                        />
                    )}
                    {searchData.description && (
                        <Badge
                            color="blue"
                            content={`Description contains ${searchData.description}`}
                        />
                    )}
                    {searchData.category && (
                        <Badge
                            color="blue"
                            content={`Category: ${searchData.category}`}
                        />
                    )}
                    {searchData.status && (
                        <Badge color="blue" content={`Status: ${searchData.status}`} />
                    )}
                    {searchData.entityType && (
                        <Badge
                            color="blue"
                            content={`Entity Type: ${searchData.entityType}`}
                        />
                    )}
                    {searchData.entityId && (
                        <Badge
                            color="blue"
                            content={`Entity Id: ${searchData.entityId}`}
                        />
                    )}
                    {searchData.impactType && (
                        <Badge
                            color="blue"
                            content={`Impact Category: ${searchData.impactType}`}
                        />
                    )}
                    {searchData.impactSeverity && (
                        <Badge
                            color="blue"
                            content={`Severity: ${searchData.impactSeverity}`}
                        />
                    )}
                    {searchData.impactLikelihood && (
                        <Badge
                            color="blue"
                            content={`Likelihood: ${searchData.impactLikelihood}`}
                        />
                    )}
                </Inline>
            </Box>
        );
    }, [searchData]);

    const handleSubmit = useCallback(
        (data) => {
            setSearchData(data);
            setExpanded(false);
        },
        [setSearchData]
    );

    const searchFormSchema = useMemo(() => {
        return {
            canReset: true,
            canCancel: false,
            submitLabel: 'Search',
            fields: [
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'id',
                    label: 'Risk Id',
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'name',
                    label: 'Risk Name',
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'description',
                    label: 'Risk Description',
                },
                {
                    component: componentTypes.SELECT,
                    name: 'category',
                    label: 'Category',
                    options: [
                        { label: 'General', value: 'GENERAL' },
                        { label: 'Cybersecurity', value: 'CYBERSECURITY' },
                    ],
                },
                {
                    component: componentTypes.SELECT,
                    name: 'status',
                    label: 'Status',
                    options: [
                        { label: 'Fully Mitigated', value: 'FULLY_MITIGATED' },
                        { label: 'Partially Mitigated', value: 'PARTIALLY_MITIGATED' },
                        { label: 'NOT Mitigated', value: 'NOT_MITIGATED' },
                        {
                            label: 'Accepted with Mitigation',
                            value: 'ACCEPTED_WITH_MITIGATION',
                        },
                        {
                            label: 'Accepted without Mitigation',
                            value: 'ACCEPTED_WITHOUT_MITIGATION',
                        },
                    ],
                },
                {
                    component: componentTypes.SELECT,
                    name: 'entityType',
                    label: 'Target Entity',
                    options: [
                        { label: 'Business Unit', value: 'BUSINESS_UNIT' },
                        { label: 'Estate', value: 'ESTATE' },
                        { label: 'Application', value: 'APPLICATION' },
                    ],
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'entityId',
                    label: 'Target Entity Id',
                    condition: {
                        when: 'entityType',
                        isNotEmpty: true,
                    },
                },
                {
                    component: componentTypes.SELECT,
                    name: 'impactType',
                    label: 'Impact Category',
                    options: [
                        { label: 'Financial', value: 'FINANCIAL' },
                        { label: 'Reputional', value: 'REPUTIONAL' },
                        { label: 'Technical', value: 'TECHNICAL' },
                        { label: 'Legal', value: 'LEGAL' },
                    ],
                },
                {
                    component: componentTypes.SELECT,
                    name: 'impactSeverity',
                    label: 'Impact Severity',
                    options: [
                        { label: 'Very High', value: 'VERY_HIGH' },
                        { label: 'High', value: 'HIGH' },
                        { label: 'Moderate', value: 'MODERATE' },
                        { label: 'Low', value: 'LOW' },
                        { label: 'Very Low', value: 'VERY_LOW' },
                    ],
                    condition: {
                        when: 'impactType',
                        isNotEmpty: true,
                    },
                },
                {
                    component: componentTypes.SELECT,
                    name: 'impactLikelihood',
                    label: 'Impact Likelihood',
                    options: [
                        { label: 'Very High', value: 'VERY_HIGH' },
                        { label: 'High', value: 'HIGH' },
                        { label: 'Moderate', value: 'MODERATE' },
                        { label: 'Low', value: 'LOW' },
                        { label: 'Very Low', value: 'VERY_LOW' },
                    ],
                    condition: {
                        when: 'impactType',
                        isNotEmpty: true,
                    },
                },
            ],
        };
    }, []);

    return (
        <ExpandableSection expanded={expanded} variant="container" header={header}>
            <Box width="100%">
                <FormRenderer
                    schema={searchFormSchema}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={initialSearchData}
                />
            </Box>
        </ExpandableSection>
    );
};

export default RiskSearch;
