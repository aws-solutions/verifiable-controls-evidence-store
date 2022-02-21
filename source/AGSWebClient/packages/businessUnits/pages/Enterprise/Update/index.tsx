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
import { useHistory } from 'react-router-dom';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import { v4 as uuidv4 } from 'uuid';
import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';
import { useAgsQuery, useAgsMutation } from '@ags/webclient-core/queries';
import { QueryType, MutationType } from '@ags/webclient-business-units-core/queries';
import {
    BusinessUnit,
    UpdateBusinessUnitParams,
    UpdateBusinessUnitResponse,
} from '@ags/webclient-business-units-core/types';
import BusinessUnitForm, {
    BusinessUnitFormData,
} from '@ags/webclient-business-units-view/components/BusinessUnits/Form';
import { ROUTE_ENTERPRISE_DETAILS } from '@ags/webclient-business-units-core/config/routes';

const EnterpriseUpdate: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();

    const {
        isLoading: isLoadingEnterprise,
        data: enterprise,
        isError: isErrorEnterprise,
        error: errorEnterprise,
    } = useAgsQuery<BusinessUnit>(QueryType.GET_BUSUSINESSUNIT, 'enterprise');

    const [input, setInput] = useState<UpdateBusinessUnitParams>();

    const mutation = useAgsMutation<
        UpdateBusinessUnitResponse,
        UpdateBusinessUnitParams,
        Error
    >(MutationType.UPDATE_ENTERPRISE, {
        onSuccess: (data: UpdateBusinessUnitResponse) => {
            history.replace(ROUTE_ENTERPRISE_DETAILS, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Update Enterprise ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: UpdateBusinessUnitParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Update Enterprise ${params.name} Failed.`,
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
            name: values.name,
            description: values.description,
            businessOwner: values.businessOwner,
            riskOwner: values.riskOwner,
            techOwner: values.techOwner,
        };
        setInput(request);
        handleUpdateEnterprise(request);
    };

    const handleUpdateEnterprise = (request: UpdateBusinessUnitParams) => {
        mutation.mutate(request);
    };

    const transformToDisplayData = (
        data?: UpdateBusinessUnitParams
    ): BusinessUnitFormData => {
        return {
            name: data?.name ?? '',
            description: data?.description,
            businessOwner: data?.businessOwner,
            riskOwner: data?.riskOwner,
            techOwner: data?.techOwner,
        };
    };

    const initialValues = useMemo(
        () => transformToDisplayData(input ?? enterprise),
        [input, enterprise]
    );

    // page
    if (isErrorEnterprise) {
        return (
            <PageError
                header="Error occurs when loading Enterprise"
                message={errorEnterprise?.message}
            />
        );
    }

    if (isLoadingEnterprise || mutation.isLoading) {
        return <PageLoading />;
    }

    return (
        <BusinessUnitForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            isUpdate={true}
            isEnterprise={true}
        />
    );
};

export default EnterpriseUpdate;
