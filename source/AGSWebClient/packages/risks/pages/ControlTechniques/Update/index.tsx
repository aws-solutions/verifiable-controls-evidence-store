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
import { generatePath, useHistory, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import { QueryType, MutationType } from '@ags/webclient-risks-core/queries';
import { useAgsQuery, useAgsMutation } from '@ags/webclient-core/queries';
import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';

import {
    ControlTechnique,
    UpdateControlTechniqueParams,
    UpdateControlTechniqueResponse,
} from '@ags/webclient-risks-core/types';
import { ROUTE_CONTROL_TECHNIQUE_DETAILS } from '@ags/webclient-risks-core/config/routes';
import ControlTechniqueForm from '@ags/webclient-risks-view/components/ControlTechniques/Form';

const ControlTechniqueUpdate: FunctionComponent = () => {
    const history = useHistory();
    const { controlTechniqueId } = useParams<{ controlTechniqueId: string }>();
    const { addNotification } = useAppLayoutContext();

    const {
        isLoading,
        data: controlTechnique,
        isError,
        error,
    } = useAgsQuery<ControlTechnique>(QueryType.GET_CONTROLTECHNIQUE, controlTechniqueId);

    const [input, setInput] = useState<UpdateControlTechniqueParams>();

    const mutation = useAgsMutation<
        UpdateControlTechniqueResponse,
        UpdateControlTechniqueParams,
        Error
    >(MutationType.UPDATE_CONTROLTECHNIQUE, {
        onSuccess: (data: UpdateControlTechniqueResponse) => {
            const path = generatePath(ROUTE_CONTROL_TECHNIQUE_DETAILS, {
                controlTechniqueId: data.id,
            });

            history.replace(path, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Update Control Technique ${data.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: UpdateControlTechniqueParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Update Control Technique ${params.name} Failed.`,
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
        const detailsData = {
            restEndpoint: '',
            eventBus: '',
            detailType: '',
            awsPolicyArn: '',
        };

        switch (values.techniqueDetails.integrationType) {
            case 'REST':
                detailsData.restEndpoint = values.techniqueDetails.restEndpoint ?? '';
                break;
            case 'EVENT':
                detailsData.eventBus = values.techniqueDetails.eventBus ?? '';
                detailsData.detailType = values.techniqueDetails.detailType ?? '';
                break;
            case 'AWS_IAM':
            case 'AWS_SCP':
                detailsData.awsPolicyArn = values.techniqueDetails.awsPolicyArn ?? '';
        }

        const request = {
            id: controlTechniqueId,
            name: values.name,
            description: values.description,
            controlType: values.controlType,
            enabled: values.enabled,
            techniqueDetails: {
                integrationType: values.techniqueDetails.integrationType,
                policyId: values.techniqueDetails.policyId ?? '',
                bundleName: values.techniqueDetails.bundleName ?? '',
                namespace: values.techniqueDetails.namespace ?? '',
                ...detailsData,
            },
        };
        setInput(request);
        handleUpdateControlObjective(request);
    };

    const handleUpdateControlObjective = (request: UpdateControlTechniqueParams) => {
        mutation.mutate(request);
    };

    // page
    if (isError) {
        return (
            <PageError
                header="Error occurs when loading Control Technique"
                message={error?.message}
            />
        );
    }

    if (isLoading || mutation.isLoading) {
        return <PageLoading />;
    }

    return (
        <ControlTechniqueForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={input ?? controlTechnique}
            isUpdate={true}
        />
    );
};

export default ControlTechniqueUpdate;
