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
    ControlObjective,
    ControlTechniqueSummary,
    UpdateControlObjectiveParams,
    UpdateControlObjectiveResponse,
} from '@ags/webclient-risks-core/types';
import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';
import {
    useAgsQuery,
    useAgsListQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';

import ControlObjectiveForm, {
    ControlObjectiveFormData,
} from '@ags/webclient-risks-view/components/ControlObjectives/Form';
import { ROUTE_CONTROL_OBJECTIVE_DETAILS } from '@ags/webclient-risks-core/config/routes';

const ControlObjectiveUpdate: FunctionComponent = () => {
    const history = useHistory();
    const { controlObjectiveId } = useParams<{ controlObjectiveId: string }>();
    const { addNotification } = useAppLayoutContext();

    const {
        isLoading: isLoadingControlObjective,
        data: controlObjective,
        isError: isErrorControlObjective,
        error: errorControlObjective,
    } = useAgsQuery<ControlObjective>(QueryType.GET_CONTROLOBJECTIVE, controlObjectiveId);

    const {
        isLoading: isLoadingControlTechniques,
        data: controlTechniques,
        isError: isErrorControlTechniques,
        error: errorControlTechniques,
    } = useAgsListQuery<ControlTechniqueSummary>(QueryType.LIST_ALL_CONTROLTECHNIQUES);

    const [input, setInput] = useState<UpdateControlObjectiveParams>();

    const mutation = useAgsMutation<
        UpdateControlObjectiveResponse,
        UpdateControlObjectiveParams,
        Error
    >(MutationType.UPDATE_CONTROLOBJECTIVE, {
        onSuccess: (data: UpdateControlObjectiveResponse) => {
            const path = generatePath(ROUTE_CONTROL_OBJECTIVE_DETAILS, {
                controlObjectiveId: data.id,
            });

            history.replace(path, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Update Control Objective ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: UpdateControlObjectiveParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Update Control Objective ${params.name} Failed.`,
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
            id: controlObjectiveId,
            name: values.name,
            description: values.description,
            controlTechniqueIds: values.controlTechniques
                ? (values.controlTechniques as ControlTechniqueSummary[]).map(
                      (item) => item.id
                  )
                : [],
        };
        setInput(request);
        handleUpdateControlObjective(request);
    };

    const handleUpdateControlObjective = (request: UpdateControlObjectiveParams) => {
        mutation.mutate(request);
    };

    const transformToDisplayData = (
        data?: UpdateControlObjectiveParams
    ): ControlObjectiveFormData => {
        return {
            name: data?.name ?? '',
            description: data?.description,
            controlTechniques: data?.controlTechniqueIds?.map((id) => ({
                id,
            })),
        };
    };

    const initialValues = useMemo(
        () => transformToDisplayData(input ?? controlObjective),
        [input, controlObjective]
    );

    // page
    if (isErrorControlObjective) {
        return (
            <PageError
                header="Error occurs when loading Control Objective"
                message={errorControlObjective?.message}
            />
        );
    }

    if (isErrorControlTechniques) {
        return (
            <PageError
                header="Error occurs when loading Control Technique list"
                message={errorControlTechniques?.message}
            />
        );
    }

    if (isLoadingControlObjective || isLoadingControlTechniques || mutation.isLoading) {
        return <PageLoading />;
    }

    return (
        <ControlObjectiveForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            controlTechniques={controlTechniques}
            isUpdate={true}
        />
    );
};

export default ControlObjectiveUpdate;
