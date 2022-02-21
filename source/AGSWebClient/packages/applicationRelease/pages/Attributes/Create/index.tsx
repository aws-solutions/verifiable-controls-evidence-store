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
import { FunctionComponent, useState } from 'react';
import { generatePath, useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import PageLoading from '@ags/webclient-core/components/PageLoading';
import { MutationType } from '@ags/webclient-application-release-core/queries';
import { useAgsMutation } from '@ags/webclient-core/queries';
import {
    CreateAttributeParams,
    CreateAttributeResponse,
} from '@ags/webclient-application-release-core/types';

import AttributeForm from '@ags/webclient-application-release-view/components/Attributes/Form';
import { AttributeFormData } from '@ags/webclient-application-release-view/components/Attributes/Form/types';
import { ROUTE_ATTRIBUTE_DETAILS } from '@ags/webclient-application-release-core/config/routes';

const defaultValue = {
    key: '',
    value: '',
    description: '',
    metadata: {},
};

const AttributeCreate: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();
    const [input, setInput] = useState<CreateAttributeParams>(defaultValue);

    const mutation = useAgsMutation<
        CreateAttributeResponse,
        CreateAttributeParams,
        Error
    >(MutationType.CREATE_ATTRIBUTE, {
        onSuccess: (data: CreateAttributeResponse) => {
            const path = generatePath(ROUTE_ATTRIBUTE_DETAILS, {
                attributeId: data.name,
            });

            history.replace(path, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Create Attribute ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: CreateAttributeParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Create Attribute ${params.key}:${params.value} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const handleCancel = () => {
        history.goBack();
    };

    const handleSubmit = (values: Record<string, any>) => {
        const request = {
            key: values.key,
            value: values.value,
            description: values.description,
            metadata: values.metadata.reduce(
                (a: any, v: { key: any; value: any }) => ({ ...a, [v.key]: v.value }),
                {}
            ),
        };
        setInput(request);
        handleCreateAttribute(request);
    };

    const handleCreateAttribute = (request: CreateAttributeParams) => {
        mutation.mutate(request);
    };

    // page
    if (mutation.isLoading) {
        return <PageLoading />;
    }

    const transformToDisplayData = (data: CreateAttributeParams): AttributeFormData => {
        return {
            ...data,
            metadata: Object.keys(data.metadata).map((key) => ({
                key: key,
                value: data.metadata[key],
            })),
        };
    };

    const initialValues = transformToDisplayData(input);
    return (
        <AttributeForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
        />
    );
};

export default AttributeCreate;
