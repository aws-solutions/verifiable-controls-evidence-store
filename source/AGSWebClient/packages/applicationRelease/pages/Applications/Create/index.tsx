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
import { FunctionComponent, useState, useMemo } from 'react';
import { generatePath, useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';
import {
    AttributeSummary,
    CreateApplicationParams,
    CreateApplicationResponse,
    Estate,
} from '@ags/webclient-application-release-core/types';
import { QueryType, MutationType } from '@ags/webclient-application-release-core/queries';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import ApplicationForm, {
    ApplicationFormData,
} from '@ags/webclient-application-release-view/components/Applications/Form';
import { ROUTE_APPLICATION_DETAILS } from '@ags/webclient-application-release-core/config/routes';

const defaultValue: ApplicationFormData = {
    name: '',
    description: '',
    applicationOwner: '',
    estate: '',
    environments: [],
    attributes: [],
};
const ApplicationCreate: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();
    const [input, setInput] = useState<ApplicationFormData>();

    // Get all attributes
    const {
        isLoading: isLoadingAttributes,
        data: attributes,
        isError: isErrorAttributes,
        error: errorAttributes,
    } = useAgsListQuery<AttributeSummary>(QueryType.LIST_ALL_ATTRIBUTES);

    // Get all estates
    const {
        isLoading: isLoadingEstates,
        data: estates,
        isError: isErrorEstates,
        error: errorEstates,
    } = useAgsListQuery<Estate>(QueryType.LIST_ALL_ESTATES);

    // Create application mutation
    const mutation = useAgsMutation<
        CreateApplicationResponse,
        CreateApplicationParams,
        Error
    >(MutationType.CREATE_APPLICATION, {
        onSuccess: (data: CreateApplicationResponse) => {
            const path = generatePath(ROUTE_APPLICATION_DETAILS, {
                applicationId: data.name,
            });

            history.replace(path, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Create Application ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: CreateApplicationParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Create Application ${params.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const attributeMap = useMemo(() => {
        if (attributes) {
            const attributeKeys = Array.from(
                new Set(attributes!.map((item) => item.key))
            );
            return Object.fromEntries(
                attributeKeys!.map((item) => [
                    item,
                    attributes!.filter((attr) => item === attr.key),
                ])
            );
        } else {
            return undefined;
        }
    }, [attributes]);

    const initialValues: ApplicationFormData = useMemo(
        () =>
            input ?? {
                ...defaultValue,
                attributes: attributeMap
                    ? Object.entries(attributeMap!)
                          .filter(([, value]) => value[0].isMandatory)
                          .map((item) => ({
                              key: item[0],
                              value: '',
                          }))
                    : [],
            },
        [attributeMap, input]
    );

    const renderPageError = (header: string, message: string | undefined) => {
        return <PageError header={header} message={message} />;
    };

    const handleCancel = () => {
        history.goBack();
    };

    const handleSubmit = (applicationFormData: ApplicationFormData) => {
        const createApplicationPayload: CreateApplicationParams = {
            name: applicationFormData.name,
            description: applicationFormData.description,
            applicationOwner: applicationFormData.applicationOwner,
            attributes: Object.fromEntries(
                applicationFormData.attributes.map(
                    (attribute: { key: string; value: string }) => [
                        attribute.key,
                        attribute.value,
                    ]
                )
            ),
            metadata: applicationFormData.metadata
                ? Object.fromEntries(
                      applicationFormData.metadata.map(
                          (metadata: { key: string; value: string }) => [
                              metadata.key,
                              metadata.value,
                          ]
                      )
                  )
                : undefined,
            estateId: applicationFormData.estate.split(':')[1],
            environmentIds: applicationFormData.environments.map(
                (item: { value: string }) => item.value
            ),
        };

        setInput(applicationFormData);
        handleCreateApplication(createApplicationPayload);
    };

    const handleCreateApplication = (request: CreateApplicationParams) => {
        mutation.mutate(request);
    };

    if (isErrorAttributes) {
        return renderPageError(
            'Error occurs when loading Attributes',
            errorAttributes?.message
        );
    }
    if (isErrorEstates) {
        return renderPageError(
            'Error occurs when loading Estates',
            errorEstates?.message
        );
    }
    if (isLoadingAttributes || isLoadingEstates || mutation.isLoading) {
        return <PageLoading />;
    }

    return (
        <ApplicationForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            attributes={attributeMap!}
            estates={estates!}
        />
    );
};

export default ApplicationCreate;
