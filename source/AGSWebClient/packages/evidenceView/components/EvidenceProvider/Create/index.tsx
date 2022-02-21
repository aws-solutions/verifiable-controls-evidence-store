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

import { FunctionComponent } from 'react';
import FormRenderer, {
    validatorTypes,
    componentTypes,
    Schema,
} from 'aws-northstar/components/FormRenderer';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';
import { jsonFieldValidator } from '../../../jsonValidator';

export type CreateEvidenceProviderFormData = Partial<
    Omit<EvidenceProvider, 'providerId' | 'createdTimestamp'>
>;

export interface CreateEvidenceProviderFormProps {
    initialValues?: CreateEvidenceProviderFormData;
    onSubmit: (formValues: Record<string, any>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const CreateEvidenceProviderForm: FunctionComponent<CreateEvidenceProviderFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting,
}) => {
    const schema: Schema = {
        header: 'Onboard a new Evidence Provider',
        fields: [
            {
                component: componentTypes.SUB_FORM,
                name: 'details',
                title: 'Evidence provider details',
                fields: [
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'name',
                        required: true,
                        dataType: 'string',
                        description: `Please provide the evidence provider's name`,
                        label: 'Evidence Provider Name',

                        validate: [
                            { type: validatorTypes.REQUIRED },
                            { type: validatorTypes.MAX_LENGTH, threshold: 128 },
                            {
                                type: validatorTypes.PATTERN,
                                pattern: /^[a-zA-Z]([\w -]*[a-zA-Z])?$/,
                            },
                        ],
                    },
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'providerId',
                        required: false,
                        dataType: 'string',
                        description: `Please provide a unique evidence provider id - OPTIONAL`,
                        label: 'Evidence Provider Id',
                        validate: [
                            { type: validatorTypes.MAX_LENGTH, threshold: 36 },
                            {
                                type: validatorTypes.PATTERN,
                                pattern: /^[a-zA-Z0-9-_]+$/,
                            },
                        ],
                    },
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'description',
                        required: false,
                        dataType: 'string',
                        description: `Please provide a brief description for your evidence provider`,
                        label: 'Description',
                        validate: [{ type: validatorTypes.MAX_LENGTH, threshold: 128 }],
                    },
                    {
                        component: componentTypes.FIELD_ARRAY,
                        name: 'schemas',
                        required: false,
                        helperText: 'Add an evidence schema',
                        validate: [
                            { type: validatorTypes.MIN_ITEMS, threshold: 1 },
                            { type: validatorTypes.REQUIRED },
                        ],
                        minItem: 1,
                        maxItems: 5,
                        fields: [
                            {
                                component: componentTypes.TEXT_FIELD,
                                name: 'schemaId',
                                required: true,
                                dataType: 'string',
                                label: 'Schema Id',
                                description: `Please provide the schema's id`,
                                validate: [
                                    { type: validatorTypes.REQUIRED },
                                    { type: validatorTypes.MAX_LENGTH, threshold: 128 },
                                    {
                                        type: validatorTypes.PATTERN,
                                        pattern: /^[a-zA-Z0-9-_]+$/,
                                    },
                                ],
                            },
                            {
                                component: componentTypes.TEXTAREA,
                                name: 'content',
                                required: true,
                                label: 'Schema',
                                description: `Please provide the JSON schema value`,
                                validate: [
                                    { type: validatorTypes.REQUIRED },
                                    {
                                        type: validatorTypes.MAX_LENGTH,
                                        threshold: 307200,
                                    }, // 300KB
                                    { type: 'json' },
                                ],
                            },
                        ],
                        buttonLabels: { add: 'Add Evidence Schema' },
                    },
                ],
            },
        ],
        canReset: true,
    };

    return (
        <FormRenderer
            initialValues={initialValues}
            schema={schema}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            validatorMapper={{ json: jsonFieldValidator }}
        />
    );
};

export default CreateEvidenceProviderForm;
