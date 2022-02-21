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
import { useAgsMutation } from '@ags/webclient-core/queries';
import { MutationType } from '@ags/webclient-evidence-core/queries';
import { FunctionComponent, useMemo, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import FormRenderer, {
    validatorTypes,
    componentTypes,
    Schema,
} from 'aws-northstar/components/FormRenderer';
import { jsonFieldValidator } from '../../../../evidenceView/jsonValidator';
import Container from 'aws-northstar/layouts/Container';
import { CreateSchemaParams } from '@ags/webclient-evidence-core/types';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import { v4 as uuid } from 'uuid';

export const CreateSchemaView: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();

    const history = useHistory();
    const { providerId } = useParams<{ providerId: string }>();
    const mutation = useAgsMutation(MutationType.CREATE_SCHEMA, {
        onSuccess: () => {
            addNotification({
                header: 'Successfully created a new schema',
                id: uuid(),
                dismissible: true,
                type: 'success',
                onDismiss: () => {
                    history.goBack();
                },
            });
        },
        onError: (error) => {
            addNotification({
                header: 'Failed to create a new schema',
                id: uuid(),
                dismissible: true,
                type: 'error',
                content: error.message,
            });
        },
    });

    const onSubmit = useCallback(
        (formValues: Record<string, any>) => {
            const request: CreateSchemaParams = {
                content: JSON.parse(formValues.content),
                providerId: providerId,
                schemaId: formValues.schemaId,
            };
            mutation.mutate(request);
        },
        [providerId, mutation]
    );

    const formSchema = useMemo<Schema>(() => {
        return {
            header: 'Add a new evidence schema',
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
        };
    }, []);

    return (
        <Container>
            <FormRenderer
                schema={formSchema}
                onSubmit={onSubmit}
                validatorMapper={{ json: jsonFieldValidator }}
                isSubmitting={mutation.isLoading}
            />
        </Container>
    );
};
