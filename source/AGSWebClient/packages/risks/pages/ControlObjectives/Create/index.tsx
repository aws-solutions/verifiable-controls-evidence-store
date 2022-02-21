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
    ControlTechniqueSummary,
    CreateControlObjectiveParams,
    CreateControlObjectiveResponse,
} from '@ags/webclient-risks-core/types';
import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import ControlObjectiveForm, {
    ControlObjectiveFormData,
} from '@ags/webclient-risks-view/components/ControlObjectives/Form';
import { ROUTE_CONTROL_OBJECTIVE_DETAILS } from '@ags/webclient-risks-core/config/routes';

const defaultValue = {
    name: '',
    description: '',
};
const ControlObjectiveCreate: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();
    const [input, setInput] = useState<CreateControlObjectiveParams>(defaultValue);

    const {
        isLoading,
        data: controlTechiques,
        isError,
        error,
    } = useAgsListQuery<ControlTechniqueSummary>(QueryType.LIST_ALL_CONTROLTECHNIQUES);

    const mutation = useAgsMutation<
        CreateControlObjectiveResponse,
        CreateControlObjectiveParams,
        Error
    >(MutationType.CREATE_CONTROLOBJECTIVE, {
        onSuccess: (data: CreateControlObjectiveResponse) => {
            const path = generatePath(ROUTE_CONTROL_OBJECTIVE_DETAILS, {
                controlObjectiveId: data.id,
            });

            history.replace(path, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Create Control Objective ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: CreateControlObjectiveParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Create Control Objective ${params.name} Failed.`,
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
            controlTechniqueIds: values.controlTechniques
                ? (values.controlTechniques as ControlTechniqueSummary[]).map(
                      (item) => item.id
                  )
                : undefined,
        };
        setInput(request);
        handleCreateControlObjective(request);
    };

    const handleCreateControlObjective = (request: CreateControlObjectiveParams) => {
        mutation.mutate(request);
    };

    // page
    if (isError) {
        return (
            <PageError
                header="Error occurs when loading Control Techniques"
                message={error?.message}
            />
        );
    }

    if (isLoading || mutation.isLoading) {
        return <PageLoading />;
    }

    const transformToDisplayData = (
        data: CreateControlObjectiveParams
    ): ControlObjectiveFormData => {
        return {
            ...data,
            controlTechniques: data.controlTechniqueIds?.map((id) => ({
                id,
            })),
        };
    };

    const initialValues = transformToDisplayData(input);
    return (
        <ControlObjectiveForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={initialValues}
            controlTechniques={controlTechiques}
        />
    );
};

export default ControlObjectiveCreate;
