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
import historyGoBackWithNotification from '@ags/webclient-core/utils/historyGoBackWithNotification';
import { useAgsMutation } from '@ags/webclient-core/queries';
import EnvClassForm from '@ags/webclient-estates-view/components/EnvClass/Form';
import { MutationType } from '@ags/webclient-estates-core/queries';
import {
    CreateEnvClassParams,
    CreateEnvClassResponse,
} from '@ags/webclient-estates-core/types';

const defaultValues = {
    name: '',
    description: '',
};
const CreateEnvClass: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();
    const [input, setInput] = useState<CreateEnvClassParams>(defaultValues);

    const mutation = useAgsMutation<CreateEnvClassResponse, CreateEnvClassParams, Error>(
        MutationType.CREATE_ENVCLASS,
        {
            onSuccess: (data: CreateEnvClassResponse) => {
                historyGoBackWithNotification(history, addNotification, {
                    id: uuidv4(),
                    type: 'success',
                    header: `Create EnvClass ${data.name} Succeeded.`,
                    dismissible: true,
                });
            },
            onError: (error: Error, params: CreateEnvClassParams) => {
                addNotification({
                    id: uuidv4(),
                    type: 'error',
                    header: `Create EnvClass ${params.name} Failed.`,
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
            description: values.description,
        };
        setInput(request);
        handleCreateEnvClass(request);
    };

    const handleCreateEnvClass = (request: CreateEnvClassParams) => {
        mutation.mutate(request);
    };

    if (mutation.isLoading) {
        return <PageLoading />;
    }

    return (
        <EnvClassForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={input}
        />
    );
};

export default CreateEnvClass;
