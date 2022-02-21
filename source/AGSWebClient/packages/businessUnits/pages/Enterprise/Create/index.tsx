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
import { useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import PageLoading from '@ags/webclient-core/components/PageLoading';
import { useAgsMutation } from '@ags/webclient-core/queries';
import {
    CreateBusinessUnitParams,
    CreateBusinessUnitResponse,
} from '@ags/webclient-business-units-core/types';
import { MutationType } from '@ags/webclient-business-units-core/queries';
import { ROUTE_ENTERPRISE_DETAILS } from '@ags/webclient-business-units-core/config/routes';

import BusinessUnitForm, {
    BusinessUnitFormData,
} from '@ags/webclient-business-units-view/components/BusinessUnits/Form';

const defaultValue = {
    name: '',
    description: '',
    businessOwner: '',
};
const EnterpriseCreate: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();
    const [input, setInput] = useState<CreateBusinessUnitParams>({
        ...defaultValue,
    });

    const mutation = useAgsMutation<
        CreateBusinessUnitResponse,
        CreateBusinessUnitParams,
        Error
    >(MutationType.CREATE_ENTERPRISE, {
        onSuccess: (data: CreateBusinessUnitResponse) => {
            history.replace(ROUTE_ENTERPRISE_DETAILS, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Create Enterprise ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: CreateBusinessUnitParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Create Enterprise ${params.name} Failed.`,
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
        handleCreateEnterprise(request);
    };

    const handleCreateEnterprise = (request: CreateBusinessUnitParams) => {
        mutation.mutate(request);
    };

    // page
    if (mutation.isLoading) {
        return <PageLoading />;
    }

    const transformToDisplayData = (
        data: CreateBusinessUnitParams
    ): BusinessUnitFormData => {
        return {
            ...data,
        };
    };

    const initialValues = transformToDisplayData(input);
    return (
        <BusinessUnitForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            isEnterprise={true}
        />
    );
};

export default EnterpriseCreate;
