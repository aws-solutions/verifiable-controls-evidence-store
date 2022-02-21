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
import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';
import {
    useAgsQuery,
    useAgsListQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import {
    BusinessUnitSummary,
    BusinessUnit,
    UpdateBusinessUnitParams,
    UpdateBusinessUnitResponse,
} from '@ags/webclient-business-units-core/types';
import { QueryType, MutationType } from '@ags/webclient-business-units-core/queries';
import BusinessUnitForm, {
    BusinessUnitFormData,
} from '@ags/webclient-business-units-view/components/BusinessUnits/Form';
import { ROUTE_BUSINESS_UNIT_DETAILS } from '@ags/webclient-business-units-core/config/routes';

const BusinessUnitUpdate: FunctionComponent = () => {
    const history = useHistory();
    const { businessUnitId } = useParams<{ businessUnitId: string }>();
    const { addNotification } = useAppLayoutContext();

    const {
        isLoading: isLoadingBusinessUnit,
        data: businessUnit,
        isError: isErrorBusinessUnit,
        error: errorBusinessUnit,
    } = useAgsQuery<BusinessUnit>(QueryType.GET_BUSUSINESSUNIT, businessUnitId);

    const {
        isLoading: isLoadingBusinessUnits,
        data: businessUnits,
        isError: isErrorBusinessUnits,
        error: errorBusinessUnits,
    } = useAgsListQuery<BusinessUnitSummary>(QueryType.LIST_BUSINESSUNITS);

    const [input, setInput] = useState<UpdateBusinessUnitParams>();

    const mutation = useAgsMutation<
        UpdateBusinessUnitResponse,
        UpdateBusinessUnitParams,
        Error
    >(MutationType.UPDATE_BUSINESSUNIT, {
        onSuccess: (data: UpdateBusinessUnitResponse) => {
            const path = generatePath(ROUTE_BUSINESS_UNIT_DETAILS, {
                businessUnitId: data.id,
            });

            history.replace(path, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Update Business Unit ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: UpdateBusinessUnitParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Update Business Unit ${params.name} Failed.`,
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
            id: businessUnitId,
            parentId: values.parentId,
            name: values.name,
            description: values.description,
            businessOwner: values.businessOwner,
            riskOwner: values.riskOwner,
            techOwner: values.techOwner,
        };
        setInput(request);
        handleUpdateBusinessUnit(request);
    };

    const handleUpdateBusinessUnit = (request: UpdateBusinessUnitParams) => {
        mutation.mutate(request);
    };

    const transformToDisplayData = (
        data?: UpdateBusinessUnitParams
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

    const initialValues = useMemo(
        () => transformToDisplayData(input ?? businessUnit),
        [input, businessUnit]
    );

    const businessUnitsForForm = useMemo(
        () => businessUnits?.filter(({ id }) => id !== businessUnitId),
        [businessUnits, businessUnitId]
    );

    // page
    if (isErrorBusinessUnit) {
        return (
            <PageError
                header="Error occurs when loading Business Unit"
                message={errorBusinessUnit?.message}
            />
        );
    }

    if (isErrorBusinessUnits) {
        return (
            <PageError
                header="Error occurs when loading Business Units List"
                message={errorBusinessUnits?.message}
            />
        );
    }

    if (isLoadingBusinessUnit || isLoadingBusinessUnits || mutation.isLoading) {
        return <PageLoading />;
    }

    return (
        <BusinessUnitForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            businessUnits={businessUnitsForForm}
            isUpdate={true}
        />
    );
};

export default BusinessUnitUpdate;
