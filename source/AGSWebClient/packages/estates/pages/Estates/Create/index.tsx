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
import { v4 as uuidv4 } from 'uuid';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';
import historyGoBackWithNotification from '@ags/webclient-core/utils/historyGoBackWithNotification';
import { useAgsMutation, useAgsListQuery } from '@ags/webclient-core/queries';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import { QueryType as BusinessUnitQueryType } from '@ags/webclient-business-units-core/queries';
import EstateForm from '@ags/webclient-estates-view/components/Estates/Form';
import {
    EnvironmentClass,
    CreateEstateParams,
    CreateEstateResponse,
} from '@ags/webclient-estates-core/types';
import { QueryType, MutationType } from '@ags/webclient-estates-core/queries';

interface EnvironmentInput {
    name: string;
    awsAccountId: string;
    envClass: string;
    isManualApprovalRequired: boolean;
}

const CreateEstate: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();
    const [input, setInput] = useState<CreateEstateParams | null>(null);

    // load business unit list
    const {
        data: businessUnits,
        isLoading: isLoadingBusinessUnits,
        isError: isErrorBusinessUnits,
    } = useAgsListQuery<BusinessUnitSummary>(BusinessUnitQueryType.LIST_BUSINESSUNITS);

    // load environment classes
    const {
        data: envClasses,
        isLoading: isLoadingEnvClasses,
        isError: isErrorEnvClasses,
    } = useAgsListQuery<EnvironmentClass>(QueryType.LIST_ENVCLASSES);

    const mutation = useAgsMutation<CreateEstateResponse, CreateEstateParams, Error>(
        MutationType.CREATE_ESTATE,
        {
            onSuccess: (data: CreateEstateResponse) => {
                const additionalInstructions = (data.additionalInstructions ?? [])
                    .reverse()
                    .reduce(
                        (result, item) =>
                            `${item.key}: [${item.value.join(',')}]; ${result}`,
                        ''
                    );
                historyGoBackWithNotification(history, addNotification, {
                    id: uuidv4(),
                    type: 'success',
                    header: `Create Estate ${data.name} Succeeded. ${additionalInstructions}.`,
                    dismissible: true,
                });
            },
            onError: (error: Error, params: CreateEstateParams) => {
                addNotification({
                    id: uuidv4(),
                    type: 'error',
                    header: `Create Estate ${params.name} Failed.`,
                    content: error.message,
                    dismissible: true,
                });
            },
        }
    );

    const handleCancel = () => {
        history.goBack();
    };

    const handleSubmit = (values: Record<string, any>) => {
        const request = {
            name: values.name,
            parentBUId: values.parentBUId,
            toolingAccountId: values.toolingAccountId,
            environments: values.environments.map((env: EnvironmentInput) => ({
                name: env.name,
                awsAccountId: env.awsAccountId,
                envClasses: [env.envClass],
                isManualApprovalRequired: env.isManualApprovalRequired,
            })),
        };
        setInput(request);
        handleRequestEstate(request);
    };

    const handleRequestEstate = (request: CreateEstateParams) => {
        mutation.mutate(request);
    };

    // transfer environment.envClasses array to a single value in envClass field
    const transformInput = (input: CreateEstateParams) => {
        return {
            ...input,
            environments: input.environments.map((env) => ({
                ...env,
                envClass: env.envClasses[0],
            })),
            consent: true,
        };
    };
    const initialValues = useMemo(
        () => (input ? transformInput(input) : undefined),
        [input]
    );

    // page
    if (isErrorBusinessUnits || isErrorEnvClasses) {
        return <PageError></PageError>;
    }

    if (isLoadingBusinessUnits || isLoadingEnvClasses || mutation.isLoading) {
        return <PageLoading />;
    }

    return (
        <EstateForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            businessUnits={businessUnits}
            envClasses={envClasses}
        />
    );
};

export default CreateEstate;
