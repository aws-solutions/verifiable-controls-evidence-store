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
import { ControlTechniqueSummary } from '@ags/webclient-risks-core/types';
import { getColumnDefinitions } from '../../ControlTechniques/Table';
import ControlObjectiviesReview from './components/Review';
import { ControlObjectiveFormData } from './types';

const customComponentMapping = {
    TABLE: FormRendererTable,
};

export interface ControlObjectiveFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isUpdate?: boolean;
    initialValues?: ControlObjectiveFormData;
    controlTechniques?: ControlTechniqueSummary[];
}

const ControlObjectiveForm: FunctionComponent<ControlObjectiveFormProps> = ({
    onSubmit,
    onCancel,
    isUpdate = false,
    initialValues = {},
    controlTechniques = [],
}) => {
    const detailsSubForm = useMemo(() => {
        return {
            name: 'controlObjectiveDetails',
            title: 'Control Objective Details',
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
            ],
        };
    }, []);

    const controlTechniquesSubForm = useMemo(() => {
        return {
            name: 'ConfigTechniques',
            title: 'Select associated control techniques',
            fields: [
                {
                    component: 'TABLE',
                    name: 'controlTechniques',
                    items: controlTechniques,
                    columnDefinitions: getColumnDefinitions(),
                    getRowId: (data: ControlTechniqueSummary) => data.id,
                    stretch: true,
                },
            ],
        };
    }, [controlTechniques]);

    const schema = useMemo(() => {
        return {
            header: isUpdate ? 'Update Control Objective' : 'Create Control Objective',
            fields: [
                {
                    component: componentTypes.WIZARD,
                    name: 'CreateControlObjectiveWizard',
                    fields: [
                        detailsSubForm,
                        controlTechniquesSubForm,
                        {
                            name: 'review',
                            title: 'Review',
                            fields: [
                                {
                                    component: componentTypes.REVIEW,
                                    name: 'review',
                                    Template: ControlObjectiviesReview,
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }, [controlTechniquesSubForm, detailsSubForm, isUpdate]);

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

export type { ControlObjectiveFormData };

export default ControlObjectiveForm;
