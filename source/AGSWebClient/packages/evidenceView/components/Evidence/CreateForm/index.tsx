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
import FormRenderer, {
    validatorTypes,
    componentTypes,
    Schema,
} from 'aws-northstar/components/FormRenderer';
import { Evidence, EvidenceProvider } from '@ags/webclient-evidence-core/types';
import { FunctionComponent } from 'react';
import useFieldApi, {
    UseFieldApiConfig,
} from '@data-driven-forms/react-form-renderer/use-field-api';
import { jsonFieldValidator } from '../../../jsonValidator';

export type CreateEvidenceParams = Partial<
    Omit<Evidence, 'evidenceId' | 'createdTimestamp'>
> & { apiKey?: string } & { attachments?: { objectKey: string }[] };

export interface CreateEvidenceFormProps {
    initialValues?: CreateEvidenceParams;
    providers?: EvidenceProvider[];
    onSubmit: (formValues: Record<string, any>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const FileUploadComponent = (props: UseFieldApiConfig) => {
    const { input, meta, label } = useFieldApi(props);
    return (
        <div>
            <label htmlFor={input.name}>{label}</label>
            <input id={input.name} {...input} />
            {meta.error && (
                <div>
                    <span style={{ color: 'red' }}>{meta.error}</span>
                </div>
            )}
        </div>
    );
};

const componentMapper = {
    'file-upload': FileUploadComponent,
};

const CreateEvidenceForm: FunctionComponent<CreateEvidenceFormProps> = ({
    initialValues,
    providers,
    onSubmit,
    onCancel,
    isSubmitting,
}) => {
    const schema: Schema = {
        header: 'Record a new Evidence',
        fields: [
            {
                component: componentTypes.SUB_FORM,
                title: 'Evidence details',
                name: 'evidencedetailsform',
                fields: [
                    {
                        component: componentTypes.SELECT,
                        name: 'providerId',
                        description: 'Please select the evidence provider',
                        label: 'Evidence Provider',
                        dataType: 'string',
                        required: true,
                        validate: [{ type: validatorTypes.REQUIRED }],
                        options: providers?.map((x) => {
                            return { label: x.name, value: x.providerId };
                        }),
                    },
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'apiKey',
                        description:
                            'Please provide the API Key for the selected evidence provider',
                        label: 'API Key',
                        dataType: 'string',
                        required: true,
                        type: 'password',
                        validate: [{ type: validatorTypes.REQUIRED }],
                    },
                    {
                        component: componentTypes.SELECT,
                        name: 'schemaId',
                        description: 'Please select the evidence schema',
                        label: 'Evidence Schema',
                        dataType: 'string',
                        required: true,
                        validate: [{ type: validatorTypes.REQUIRED }],
                        resolveProps: (_props: any, _field: any, formOptions: any) => {
                            const values = formOptions.getState().values;

                            return {
                                options: providers
                                    ?.find((x) => x.providerId === values.providerId)
                                    ?.schemas?.map((x) => {
                                        return { label: x.schemaId, value: x.schemaId };
                                    }),
                            };
                        },
                    },
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'targetId',
                        description: 'Please provide the evidence target id',
                        label: 'Evidence Target Id',
                        dataType: 'string',
                        required: true,
                        validate: [
                            { type: validatorTypes.REQUIRED },
                            {
                                type: validatorTypes.PATTERN,
                                pattern: /^\S+$/,
                                message: 'Target Id must not contain any space.',
                            },
                        ],
                    },
                    {
                        component: componentTypes.FIELD_ARRAY,
                        name: 'additionalTargetIds',
                        helperText: 'Please provide any additional target ids',
                        fields: [
                            {
                                component: componentTypes.TEXT_FIELD,
                                name: 'value',
                                dataType: 'string',
                                validate: [
                                    { type: validatorTypes.REQUIRED },
                                    {
                                        type: validatorTypes.PATTERN,
                                        pattern: /^\S+$/,
                                        message: 'Target Id must not contain any space.',
                                    },
                                ],
                            },
                        ],
                        maxItems: 5,
                    },
                    {
                        component: componentTypes.TEXTAREA,
                        name: 'content',
                        description: 'Please provide the evidence content',
                        label: 'Evidence Content',
                        dataType: 'string',
                        required: true,
                        validate: [{ type: validatorTypes.REQUIRED }, { type: 'json' }],
                    },
                    {
                        component: componentTypes.FIELD_ARRAY,
                        name: 'attachments',
                        required: false,
                        helperText: 'Add an attachment',
                        fields: [
                            {
                                component: 'file-upload',
                                label: 'File Upload',
                                name: 'filePath',
                                type: 'file',
                                validate: [{ type: validatorTypes.REQUIRED }],
                            },
                        ],
                        buttonLabels: { add: 'Add New Artifact' },
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
            customComponentWrapper={componentMapper}
            isSubmitting={isSubmitting}
            validatorMapper={{ json: jsonFieldValidator }}
        />
    );
};

export default CreateEvidenceForm;
