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
import PageError from '@ags/webclient-core/components/PageError';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import {
    BusinessUnitSummary,
    CreateBusinessUnitParams,
    CreateBusinessUnitResponse,
} from '@ags/webclient-business-units-core/types';
import { QueryType, MutationType } from '@ags/webclient-business-units-core/queries';
import BusinessUnitForm, {
    BusinessUnitFormData,
} from '@ags/webclient-business-units-view/components/BusinessUnits/Form';
import { ROUTE_BUSINESS_UNIT_DETAILS } from '@ags/webclient-business-units-core/config/routes';

const defaultValue = {
    name: '',
    description: '',
    businessOwner: '',
};
const BusinessUnitCreate: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();
    const [input, setInput] = useState<CreateBusinessUnitParams>({
        ...defaultValue,
    });

    // get all business units
    const {
        isLoading: isLoadingBusinessUnits,
        data: businessUnits,
        isError: isErrorBusinessUnits,
        error: errorBusinessUnits,
    } = useAgsListQuery<BusinessUnitSummary>(QueryType.LIST_BUSINESSUNITS);

    const mutation = useAgsMutation<
        CreateBusinessUnitResponse,
        CreateBusinessUnitParams,
        Error
    >(MutationType.CREATE_BUSINESSUNIT, {
        onSuccess: (data: CreateBusinessUnitResponse) => {
            const path = generatePath(ROUTE_BUSINESS_UNIT_DETAILS, {
                businessUnitId: data.id,
            });

            history.replace(path, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Create Business Unit ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: CreateBusinessUnitParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Create Business Unit ${params.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const handleCancel = () => {
        history.goBack();
    };

    const handleSubmit = (values: Record<string, any>) => {
        console.log(values);
        const request = {
            parentId: values.parentId,
            name: values.name,
            description: values.description,
            businessOwner: values.businessOwner,
            riskOwner: values.riskOwner,
            techOwner: values.techOwner,
        };
        setInput(request);
        handleCreateBusinessUnit(request);
    };

    const handleCreateBusinessUnit = (request: CreateBusinessUnitParams) => {
        mutation.mutate(request);
    };

    // page
    if (isLoadingBusinessUnits || mutation.isLoading) {
        return <PageLoading />;
    }

    if (isErrorBusinessUnits) {
        return (
            <PageError
                header="Error occurs when loading Business Units List"
                message={errorBusinessUnits?.message}
            />
        );
    }

    const transformToDisplayData = (
        data: CreateBusinessUnitParams
    ): BusinessUnitFormData => {
        return {
            parentId: data?.parentId,
            name: data?.name ?? '',
            description: data?.description,
            businessOwner: data?.businessOwner,
            riskOwner: data?.riskOwner,
            techOwner: data?.techOwner,
        };
    };

    const initialValues = transformToDisplayData(input);
    return (
        <BusinessUnitForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            businessUnits={businessUnits}
        />
    );
};

export default BusinessUnitCreate;
