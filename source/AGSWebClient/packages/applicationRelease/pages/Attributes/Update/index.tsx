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
import { generatePath, useHistory, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import { QueryType, MutationType } from '@ags/webclient-application-release-core/queries';
import { useAgsQuery, useAgsMutation } from '@ags/webclient-core/queries';
import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';

import {
    Attribute,
    UpdateAttributeParams,
    UpdateAttributeResponse,
} from '@ags/webclient-application-release-core/types';
import { ROUTE_ATTRIBUTE_DETAILS } from '@ags/webclient-application-release-core/config/routes';
import AttributeForm from '@ags/webclient-application-release-view/components/Attributes/Form';
import { AttributeFormData } from '@ags/webclient-application-release-view/components/Attributes/Form/types';

const AttributeUpdate: FunctionComponent = () => {
    const history = useHistory();
    const { attributeId } = useParams<{ attributeId: string }>();
    const { addNotification } = useAppLayoutContext();

    const {
        isLoading,
        data: attribute,
        isError,
        error,
    } = useAgsQuery<Attribute>(QueryType.GET_ATTRIBUTE, attributeId);

    const [input, setInput] = useState<UpdateAttributeParams>();

    const mutation = useAgsMutation<
        UpdateAttributeResponse,
        UpdateAttributeParams,
        Error
    >(MutationType.UPDATE_ATTRIBUTE, {
        onSuccess: (data: UpdateAttributeResponse) => {
            const path = generatePath(ROUTE_ATTRIBUTE_DETAILS, {
                attributeId: data.name,
            });

            history.replace(path, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Update Attribute ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: UpdateAttributeParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Update Attribute ${params.name} Failed.`,
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
            name: values.name,
            key: values.key,
            value: values.value,
            description: values.description,
            metadata: values.metadata.reduce(
                (a: any, v: { key: any; value: any }) => ({ ...a, [v.key]: v.value }),
                {}
            ),
        };
        setInput(request);
        handleUpdateApplication(request);
    };

    const handleUpdateApplication = (request: UpdateAttributeParams) => {
        mutation.mutate(request);
    };

    // page
    if (isError || !attribute) {
        return (
            <PageError
                header="Error occurs when loading Attribute"
                message={error?.message}
            />
        );
    }

    if (isLoading || mutation.isLoading) {
        return <PageLoading />;
    }

    const transformToDisplayData = (data: UpdateAttributeParams): AttributeFormData => {
        return {
            ...data,
            metadata: Object.keys(data?.metadata).map((key) => ({
                key: key,
                value: data.metadata[key],
            })),
        };
    };

    const initialValues = transformToDisplayData(input ?? attribute);
    return (
        <AttributeForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            isUpdate={true}
        />
    );
};

export default AttributeUpdate;
