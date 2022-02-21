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
import {
    ControlObjectiveSummary,
    RiskOptions,
    CreateRiskParams,
    CreateRiskResponse,
} from '@ags/webclient-risks-core/types';

import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import {
    useAgsQuery,
    useAgsListQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';

import RiskForm, { RiskFormData } from '@ags/webclient-risks-view/components/Risks/Form';
import { ROUTE_RISK_DETAILS } from '@ags/webclient-risks-core/config/routes';

const defaultValue = {
    name: '',
    description: '',
    category: '',
    severity: '',
    likelihood: '',
    rating: '',
};
const RiskCreate: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();
    const [input, setInput] = useState<CreateRiskParams>(defaultValue);

    const {
        isLoading,
        data: controlObjectives,
        isError,
        error,
    } = useAgsListQuery<ControlObjectiveSummary>(QueryType.LIST_ALL_CONTROLOBJECTIVES);

    const {
        isLoading: isLoadingRiskOptions,
        data: riskOptions,
        isError: isErrorRiskOptions,
        error: errorRiskOptions,
    } = useAgsQuery<RiskOptions>(QueryType.GET_RISK_OPTIONS);

    const mutation = useAgsMutation<CreateRiskResponse, CreateRiskParams, Error>(
        MutationType.CREATE_RISK,
        {
            onSuccess: (data: CreateRiskResponse) => {
                const path = generatePath(ROUTE_RISK_DETAILS, {
                    riskId: data.id,
                });

                history.replace(path, {
                    notifications: [
                        {
                            id: uuidv4(),
                            type: 'success',
                            header: `Create Risk ${data.name} Succeeded.`,
                            dismissible: true,
                        },
                    ],
                });
            },
            onError: (error: Error, params: CreateRiskParams) => {
                addNotification({
                    id: uuidv4(),
                    type: 'error',
                    header: `Create Risk ${params.name} Failed.`,
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
        console.log(values);
        const request = {
            name: values.name,
            description: values.description,
            category: values.category,
            severity: values.severity,
            likelihood: values.likelihood,
            rating: values.rating,
            controlObjectiveIds: values.controlObjectives
                ? (values.controlObjectives as ControlObjectiveSummary[]).map(
                      (item) => item.id
                  )
                : undefined,
        };
        setInput(request);
        handleCreateRisk(request);
    };

    const handleCreateRisk = (request: CreateRiskParams) => {
        mutation.mutate(request);
    };

    // page
    if (isError) {
        return (
            <PageError
                header="Error occurs when loading Control Objectives"
                message={error?.message}
            />
        );
    }

    if (isErrorRiskOptions) {
        return (
            <PageError
                header="Error occurs when loading Risk Options"
                message={errorRiskOptions?.message}
            />
        );
    }

    if (isLoading || isLoadingRiskOptions || mutation.isLoading) {
        return <PageLoading />;
    }

    const transformToDisplayData = (data: CreateRiskParams): RiskFormData => {
        return {
            ...data,
            controlObjectives: data.controlObjectiveIds?.map((id) => ({
                id,
            })),
        };
    };

    const initialValues = transformToDisplayData(input);
    return (
        <RiskForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            controlObjectives={controlObjectives}
            riskOptions={riskOptions!}
        />
    );
};

export default RiskCreate;
