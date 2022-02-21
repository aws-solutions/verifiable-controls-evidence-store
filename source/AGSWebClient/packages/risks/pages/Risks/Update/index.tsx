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
import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import {
    useAgsQuery,
    useAgsListQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import {
    Risk,
    ControlObjectiveSummary,
    RiskOptions,
    UpdateRiskParams,
    UpdateRiskResponse,
} from '@ags/webclient-risks-core/types';

import RiskForm, { RiskFormData } from '@ags/webclient-risks-view/components/Risks/Form';
import { ROUTE_RISK_DETAILS } from '@ags/webclient-risks-core/config/routes';

const RiskUpdate: FunctionComponent = () => {
    const history = useHistory();
    const { riskId } = useParams<{ riskId: string }>();
    const { addNotification } = useAppLayoutContext();

    const {
        isLoading: isLoadingRisk,
        data: risk,
        isError: isErrorRisk,
        error: errorRisk,
    } = useAgsQuery<Risk>(QueryType.GET_RISK, riskId);

    const {
        isLoading: isLoadingControlObjectives,
        data: controlObjectives,
        isError: isErrorControlObjectives,
        error: errorControlObjectives,
    } = useAgsListQuery<ControlObjectiveSummary>(QueryType.LIST_ALL_CONTROLOBJECTIVES);

    const {
        isLoading: isLoadingRiskOptions,
        data: riskOptions,
        isError: isErrorRiskOptions,
        error: errorRiskOptions,
    } = useAgsQuery<RiskOptions>(QueryType.GET_RISK_OPTIONS);

    const [input, setInput] = useState<UpdateRiskParams>();

    const mutation = useAgsMutation<UpdateRiskResponse, UpdateRiskParams, Error>(
        MutationType.UPDATE_RISK,
        {
            onSuccess: (data: UpdateRiskResponse) => {
                const path = generatePath(ROUTE_RISK_DETAILS, {
                    riskId: data.id,
                });

                history.replace(path, {
                    notifications: [
                        {
                            id: uuidv4(),
                            type: 'success',
                            header: `Update Risk ${data.name} Succeeded.`,
                            dismissible: true,
                        },
                    ],
                });
            },
            onError: (error: Error, params: UpdateRiskParams) => {
                addNotification({
                    id: uuidv4(),
                    type: 'error',
                    header: `Update Risk ${params.name} Failed.`,
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
            id: riskId,
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
                : [],
        };
        setInput(request);
        handleUpdateRisk(request);
    };

    const handleUpdateRisk = (request: UpdateRiskParams) => {
        mutation.mutate(request);
    };

    const transformToDisplayData = (data?: UpdateRiskParams): RiskFormData => {
        return {
            name: data?.name ?? '',
            description: data?.description,
            category: data?.category,
            severity: data?.severity,
            likelihood: data?.likelihood,
            rating: data?.rating,
            controlObjectives: data?.controlObjectiveIds?.map((id) => ({
                id,
            })),
        };
    };

    const initialValues = useMemo(
        () => transformToDisplayData(input ?? risk),
        [input, risk]
    );

    // page
    if (isErrorRisk) {
        return (
            <PageError
                header="Error occurs when loading Risk"
                message={errorRisk?.message}
            />
        );
    }

    if (isErrorControlObjectives) {
        return (
            <PageError
                header="Error occurs when loading Control Objective list"
                message={errorControlObjectives?.message}
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

    if (
        isLoadingRisk ||
        isLoadingControlObjectives ||
        isLoadingRiskOptions ||
        mutation.isLoading
    ) {
        return <PageLoading />;
    }

    return (
        <RiskForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            controlObjectives={controlObjectives}
            isUpdate={true}
            riskOptions={riskOptions!}
        />
    );
};

export default RiskUpdate;
