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
import { ControlTechnique } from '@ags/webclient-risks-core/types';
import ControlTechniqueReview from './components/Review';

export type ControlTechniqueFormData = Partial<
    Omit<ControlTechnique, 'id' | 'createTime' | 'lastUpdateTime' | 'controlObjectives'>
>;

export interface ControlTechniqueFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isUpdate?: boolean;
    initialValues?: ControlTechniqueFormData;
}

const ControlTechniqueForm: FunctionComponent<ControlTechniqueFormProps> = ({
    onSubmit,
    onCancel,
    isUpdate = false,
    initialValues = {},
}) => {
    const detailsSubForm = useMemo(() => {
        const controlTypeOptions = [
            {
                label: 'Detective',
                value: 'DETECTIVE',
            },
            {
                label: 'Preventive',
                value: 'PREVENTIVE',
            },
            {
                label: 'Corrective',
                value: 'CORRECTIVE',
            },
        ];

        return {
            name: 'controlTechniqueDetails',
            title: 'Control Technique Details',
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
                    component: componentTypes.SELECT,
                    name: 'controlType',
                    label: 'Control Type',
                    isRequired: true,
                    options: controlTypeOptions,
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
                    component: componentTypes.SWITCH,
                    name: 'enabled',
                    label: 'Enable Control Technique',
                },
            ],
        };
    }, []);

    const techniqueDetailsSubForm = useMemo(() => {
        return {
            title: 'Policy Settings',
            description: 'Setup policy on this control technique',
            name: 'policies',
            fields: [
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'techniqueDetails.policyId',
                    label: 'Policy ID',
                    isRequired: true,
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'techniqueDetails.bundleName',
                    label: 'Policy Bundle Name',
                    isRequired: true,
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'techniqueDetails.namespace',
                    label: 'Policy Namespace',
                    isRequired: true,
                },
            ],
        };
    }, []);

    const controlIntegrationSubForm = useMemo(() => {
        const integrationTypeOptions = [
            {
                label: 'None',
                value: 'NONE',
            },

            {
                label: 'REST API',
                value: 'REST',
            },
            {
                label: 'Event Bus',
                value: 'EVENT',
            },
            {
                label: 'AWS IAM',
                value: 'AWS_IAM',
            },
            {
                label: 'AWS SCP',
                value: 'AWS_SCP',
            },
            {
                label: 'AWS Config',
                value: 'AWS_CONFIG',
            },
        ];

        return {
            title: 'Control Integration',
            description: 'Integration with control implementations',
            name: 'controlIntegration',
            fields: [
                {
                    component: componentTypes.SELECT,
                    name: 'techniqueDetails.integrationType',
                    label: 'Integration Type',
                    options: integrationTypeOptions,
                    isRequired: true,
                    validate: [
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                },

                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'techniqueDetails.restEndpoint',
                    label: 'REST Endpoint',
                    isRequired: true,
                    condition: {
                        when: 'techniqueDetails.integrationType',
                        is: 'REST',
                    },
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'techniqueDetails.eventBus',
                    label: 'Event Bus',
                    isRequired: true,
                    condition: {
                        when: 'techniqueDetails.integrationType',
                        is: 'EVENT',
                    },
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'techniqueDetails.detailType',
                    label: 'Event Bus Detail Type',
                    isRequired: true,
                    condition: {
                        when: 'techniqueDetails.integrationType',
                        is: 'EVENT',
                    },
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'techniqueDetails.awsPolicyArn',
                    label: 'AWS Policy Arn',
                    isRequired: true,
                    condition: {
                        or: [
                            {
                                when: 'techniqueDetails.integrationType',
                                is: 'AWS_IAM',
                            },
                            {
                                when: 'techniqueDetails.integrationType',
                                is: 'AWS_SCP',
                            },
                        ],
                    },
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'techniqueDetails.configRuleArn',
                    label: 'AWS Config Rule ARN',
                    condition: {
                        when: 'techniqueDetails.integrationType',
                        is: 'AWS_CONFIG',
                    },
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'techniqueDetails.cpSourceUrls',
                    label: 'Conformance Pack File URL',
                    isRequired: true,
                    condition: {
                        when: 'techniqueDetails.integrationType',
                        is: 'AWS_CONFIG',
                    },
                    validate: [
                        { type: validatorTypes.URL },
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                },
            ],
        };
    }, []);

    const schema = useMemo(() => {
        return {
            header: isUpdate ? 'Update Control Technique' : 'Create Control Technique',
            fields: [
                {
                    component: componentTypes.WIZARD,
                    name: 'CreateControlTechniqueWizard',
                    fields: [
                        detailsSubForm,
                        techniqueDetailsSubForm,
                        controlIntegrationSubForm,
                        {
                            name: 'review',
                            title: 'Review',
                            fields: [
                                {
                                    component: componentTypes.REVIEW,
                                    name: 'review',
                                    Template: ControlTechniqueReview,
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }, [isUpdate, controlIntegrationSubForm, detailsSubForm, techniqueDetailsSubForm]);

    return (
        <FormRenderer
            schema={schema}
            onSubmit={onSubmit}
            onCancel={onCancel}
            initialValues={initialValues}
        />
    );
};

export default ControlTechniqueForm;
