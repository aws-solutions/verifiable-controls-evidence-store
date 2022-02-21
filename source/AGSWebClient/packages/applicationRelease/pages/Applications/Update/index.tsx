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
import { generatePath, useHistory, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import {
    Application,
    AttributeSummary,
    Estate,
    UpdateApplicationParams,
    UpdateApplicationResponse,
} from '@ags/webclient-application-release-core/types';
import { QueryType, MutationType } from '@ags/webclient-application-release-core/queries';
import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';
import {
    useAgsQuery,
    useAgsListQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import { ROUTE_APPLICATION_DETAILS } from '@ags/webclient-application-release-core/config/routes';
import ApplicationForm, {
    ApplicationFormData,
} from '@ags/webclient-application-release-view/components/Applications/Form';

const ApplicationUpdate: FunctionComponent = () => {
    const history = useHistory();
    const { applicationId } = useParams<{ applicationId: string }>();
    const { addNotification } = useAppLayoutContext();

    // Get Application details
    const {
        isLoading: isLoadingApplication,
        data: application,
        isError: isErrorApplication,
        error: errorApplication,
    } = useAgsQuery<Application>(QueryType.GET_APPLICATION, applicationId);

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

    const [input, setInput] = useState<ApplicationFormData>();

    const mutation = useAgsMutation<
        UpdateApplicationResponse,
        UpdateApplicationParams,
        Error
    >(MutationType.UPDATE_APPLICATION, {
        onSuccess: (data: UpdateApplicationResponse) => {
            const path = generatePath(ROUTE_APPLICATION_DETAILS, {
                applicationId: data.name,
            });

            history.replace(path, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Update Application ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: UpdateApplicationParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Update Application ${params.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const handleCancel = () => {
        history.goBack();
    };

    const renderPageError = (header: string, message: string | undefined) => {
        return <PageError header={header} message={message} />;
    };

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

    const handleSubmit = (applicationFormData: ApplicationFormData) => {
        const updateApplicationPayload: UpdateApplicationParams = {
            id: applicationId,
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
        handleUpdateApplication(updateApplicationPayload);
    };

    const handleUpdateApplication = (request: UpdateApplicationParams) => {
        mutation.mutate(request);
    };

    const transformToDisplayData = (
        input: ApplicationFormData | undefined,
        application: UpdateApplicationParams | undefined,
        estates: Estate[]
    ): ApplicationFormData | undefined => {
        if (estates && (input || application)) {
            const estateId = input ? input.estate.split(':')[1] : application?.estateId;
            const applicationName = input ? input.name : application?.name;
            const description = input ? input.description : application?.description;
            const applicationOwner = input
                ? input.applicationOwner
                : application?.applicationOwner;
            const estate = estates
                ? estates.find((item) => item.id === estateId)
                : undefined;
            return {
                name: applicationName!,
                description,
                applicationOwner: applicationOwner!,
                estate: input ? input.estate : `${estate?.name}:${application?.estateId}`,
                environments: input
                    ? input.environments
                    : application?.environmentIds.map((item) => ({
                          label: estate?.environments.find((env) => env.id === item)
                              ?.name!,
                          value: item,
                      }))!,
                attributes: input
                    ? input.attributes
                    : Object.entries(application?.attributes!)
                          .map(([key, value]) => ({
                              name: `${key}:${value}`,
                              key,
                              value,
                          }))
                          .sort((attr1, attr2) =>
                              attr1.key > attr2.key ? 1 : attr1.key < attr2.key ? -1 : 0
                          ),
                metadata: input
                    ? input.metadata
                    : application?.metadata
                    ? Object.entries(application?.metadata!).map(([key, value]) => ({
                          key,
                          value,
                      }))
                    : undefined,
            };
        }
    };

    const initialValues = useMemo(
        () => transformToDisplayData(input, application, estates!),
        [input, application, estates]
    );

    if (isErrorApplication) {
        return renderPageError(
            'Error occurs when loading Application',
            errorApplication?.message
        );
    }

    if (isErrorEstates) {
        return renderPageError(
            'Error occurs when loading Estates',
            errorEstates?.message
        );
    }

    if (isErrorAttributes) {
        return renderPageError(
            'Error occurs when loading Attributes',
            errorAttributes?.message
        );
    }

    if (
        isLoadingApplication ||
        isLoadingEstates ||
        isLoadingAttributes ||
        mutation.isLoading
    ) {
        return <PageLoading />;
    }

    return (
        <ApplicationForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            attributes={attributeMap!}
            estates={estates!}
            isUpdate={true}
        />
    );
};

export default ApplicationUpdate;
