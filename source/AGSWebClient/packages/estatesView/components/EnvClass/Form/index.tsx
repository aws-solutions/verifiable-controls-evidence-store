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
    componentTypes,
    validatorTypes,
} from 'aws-northstar/components/FormRenderer';
import { CreateEnvClassParams } from '@ags/webclient-estates-core/types';

export interface EnvClassFormProps {
    onSubmit: (values: Record<string, any>) => void;
    onCancel: () => void;
    initialValues: CreateEnvClassParams;
}

const EnvClassForm: FunctionComponent<EnvClassFormProps> = ({
    onSubmit,
    onCancel,
    initialValues,
}) => {
    const schema = {
        fields: [
            {
                component: componentTypes.SUB_FORM,
                title: 'Create New Environment Class',
                name: 'envClassForm',
                description:
                    'Please type in the information about the new Environment Class and click Create to create a new Environment Class',
                fields: [
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'name',
                        label: 'EnvClass name',
                        description: 'A unique name for the new environment class',
                        validate: [
                            {
                                type: validatorTypes.REQUIRED,
                                message: 'Please enter an unique name',
                            },
                            {
                                type: validatorTypes.MIN_LENGTH,
                                threshold: 3,
                                message:
                                    'An environment class name must be at least 3 characters long.',
                            },
                            {
                                type: validatorTypes.MAX_LENGTH,
                                threshold: 128,
                                message:
                                    'An environment class name must be no more than 128 characters long.',
                            },
                        ],
                    },
                    {
                        component: componentTypes.TEXTAREA,
                        name: 'description',
                        label: 'Description',
                        description: 'A description for the new environment class.',
                        validate: [
                            {
                                type: validatorTypes.MAX_LENGTH,
                                threshold: 1000,
                                message:
                                    'An description must be no more than 1000 characters long.',
                            },
                        ],
                    },
                ],
            },
        ],
    };

    return (
        <FormRenderer
            schema={schema}
            onSubmit={onSubmit}
            onCancel={onCancel}
            initialValues={initialValues}
        />
    );
};

export default EnvClassForm;
