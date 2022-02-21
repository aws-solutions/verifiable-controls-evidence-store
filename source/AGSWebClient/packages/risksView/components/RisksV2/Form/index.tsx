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
import FormRenderer, {
    componentTypes,
    validatorTypes,
} from 'aws-northstar/components/FormRenderer';
import FormRendererTable from 'aws-northstar/components/FormRendererTable';
import { ControlObjectiveSummary, RiskOptions } from '@ags/webclient-risks-core/types';

import { getColumnDefinitions } from '../../ControlTechniques/Table';
import RiskReview from './components/Review';
import { RiskFormData } from './types';

/**ToDo:
 * 1. Load the risk impact category
 * 2. Load the target entity type list
 * 3. Search for the entity details when Target Entity Type changes
 * 4. Submit
 */

const customComponentMapping = {
    TABLE: FormRendererTable,
};

export interface RiskFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isUpdate?: boolean;
    initialValues?: RiskFormData;
    controlObjectives?: ControlObjectiveSummary[];
    riskOptions: RiskOptions;
}

const RiskForm: FunctionComponent<RiskFormProps> = ({
    onSubmit,
    onCancel,
    isUpdate = false,
    initialValues = {},
    controlObjectives = [],
    riskOptions,
}) => {
    const riskOptionEntries = useMemo(
        () => ({
            category: riskOptions.riskCategory.map((name) => ({
                label: name,
                value: name,
            })),
            severity: riskOptions.riskSeverity.map((name) => ({
                label: name,
                value: name,
            })),
            likelihood: riskOptions.riskLikelihood.map((name) => ({
                label: name,
                value: name,
            })),
        }),
        [riskOptions]
    );

    const detailsSubForm = useMemo(() => {
        return {
            name: 'riskDetails',
            title: 'Risk Details',
            fields: [
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'name',
                    label: 'Name',
                    isRequired: true,
                    validate: [
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                },
                {
                    component: componentTypes.TEXTAREA,
                    name: 'description',
                    label: 'Description',
                    isRequired: true,
                    validate: [
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                },
                {
                    component: componentTypes.SELECT,
                    name: 'category',
                    label: 'Category',
                    isRequired: true,
                    options: riskOptionEntries['category'],
                    validate: [
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                },
            ],
        };
    }, [riskOptionEntries]);

    const getRowId = (data: ControlObjectiveSummary) => data.id;
    const controlObjectivesSubForm = useMemo(() => {
        return {
            name: 'ConfigObjectives',
            title: 'Select mitigation control objectives',
            fields: [
                {
                    component: 'TABLE',
                    name: 'controlObjectives',
                    items: controlObjectives,
                    columnDefinitions: getColumnDefinitions(),
                    getRowId,
                    stretch: true,
                },
            ],
        };
    }, [controlObjectives]);

    const riskAssociationSubForm = useMemo(() => {
        return {
            name: 'Risk Targets',
            title: 'Select target governed entities',
            fields: [
                {
                    component: componentTypes.FIELD_ARRAY,
                    name: 'governedEntities',
                    displayLablePerItem: true,
                    renderContainer: true,
                    layout: 'grid',
                    buttonLabels: {
                        add: 'Add a new risk target entity',
                    },
                    fields: [
                        {
                            component: componentTypes.SELECT,
                            name: 'entityType',
                            label: 'Target Entity Type',
                            column: 5,
                            placeholder: 'Choose the entity type',
                            options: [
                                { label: 'Business Unit', value: 'BusinessUnit' },
                                { label: 'Estate', value: 'Estate' },
                                { label: 'Application', value: 'Application' },
                                { label: 'Environment', value: 'Environment' },
                            ],
                            validate: [
                                {
                                    type: validatorTypes.REQUIRED,
                                },
                            ],
                        },
                        {
                            component: componentTypes.SELECT,
                            name: 'entityId',
                            label: 'Entity Id',
                            column: 5,
                            isRequired: true,
                            isSearchable: true,
                            options: [
                                { label: '1', value: '1' },
                                { label: '2', value: '2' },
                                { label: '3', value: '3' },
                                { label: '4', value: '4' },
                            ],
                            validate: [
                                {
                                    type: validatorTypes.REQUIRED,
                                },
                            ],
                        },
                        {
                            component: componentTypes.TEXT_FIELD,
                            name: 'owner',
                            label: 'Owner',
                            column: 5,
                            isRequired: true,
                            validate: [
                                {
                                    type: validatorTypes.REQUIRED,
                                },
                            ],
                        },
                        {
                            component: componentTypes.SELECT,
                            name: 'likelihood',
                            label: 'Likelihood',
                            column: 5,
                            isRequired: true,
                            options: riskOptionEntries['likelihood'],
                            validate: [
                                {
                                    type: validatorTypes.REQUIRED,
                                },
                            ],
                        },
                        {
                            component: componentTypes.FIELD_ARRAY,
                            label: 'Impacts',
                            name: 'impacts',
                            helperText: 'You can add up to 6 impacts',
                            column: 12,
                            minItems: 1,
                            maxItems: 6,
                            buttonLabels: {
                                add: 'Add a new impact',
                            },
                            noItemsMessage: 'Add a new impact',
                            validate: [
                                {
                                    type: validatorTypes.REQUIRED,
                                },
                                {
                                    type: validatorTypes.MIN_ITEMS,
                                    threshold: 1,
                                },
                            ],
                            fields: [
                                {
                                    component: componentTypes.SELECT,
                                    name: 'impact',
                                    label: 'Impact',
                                    isRequired: true,
                                    options: [
                                        { label: 'Reputational', value: 'Reputational' },
                                        { label: 'Financial', value: 'Financial' },
                                        {
                                            label: 'Organizational',
                                            value: 'Organizational',
                                        },
                                    ],
                                    validate: [
                                        {
                                            type: validatorTypes.REQUIRED,
                                        },
                                    ],
                                },
                                {
                                    component: componentTypes.SELECT,
                                    name: 'severity',
                                    label: 'Severity',
                                    isRequired: true,
                                    options: riskOptionEntries['severity'],
                                    validate: [
                                        {
                                            type: validatorTypes.REQUIRED,
                                        },
                                    ],
                                },
                                {
                                    component: componentTypes.SELECT,
                                    name: 'likelihood',
                                    label: 'Likelihood',
                                    isRequired: true,
                                    options: riskOptionEntries['likelihood'],
                                    validate: [
                                        {
                                            type: validatorTypes.REQUIRED,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }, [riskOptionEntries]);

    const schema = useMemo(() => {
        return {
            header: isUpdate ? 'Update Risk' : 'Create Risk',
            fields: [
                {
                    component: componentTypes.WIZARD,
                    name: 'RiskWizard',
                    fields: [
                        detailsSubForm,
                        controlObjectivesSubForm,
                        riskAssociationSubForm,
                        {
                            name: 'review',
                            title: 'Review',
                            fields: [
                                {
                                    component: componentTypes.REVIEW,
                                    name: 'review',
                                    Template: RiskReview,
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }, [controlObjectivesSubForm, detailsSubForm, riskAssociationSubForm, isUpdate]);

    return (
        <FormRenderer
            schema={schema}
            onSubmit={onSubmit}
            onCancel={onCancel}
            customComponentWrapper={customComponentMapping}
            initialValues={initialValues}
        />
    );
};

export type { RiskFormData };

export default RiskForm;
