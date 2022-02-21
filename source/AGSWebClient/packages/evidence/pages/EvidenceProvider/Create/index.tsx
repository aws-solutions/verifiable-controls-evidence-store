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
import { v4 as uuid } from 'uuid';
import Container from 'aws-northstar/layouts/Container';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import { useAgsMutation } from '@ags/webclient-core/queries';

import CreateEvidenceProviderForm, {
    CreateEvidenceProviderFormData,
} from '@ags/webclient-evidence-view/components/EvidenceProvider/Create';
import CreateConfirmationModal, {
    CreateConfirmationViewModel,
} from '@ags/webclient-evidence-view/components/EvidenceProvider/CreateConfirmationModal';
import {
    CreateEvidenceProviderParams,
    CreateEvidenceProviderResponse,
} from '@ags/webclient-evidence-core/types';
import { MutationType } from '@ags/webclient-evidence-core/queries/types';

const CreateEvidenceProvider: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();
    const [input, setInput] = useState<CreateEvidenceProviderFormData>({});
    const [newEvidenceProvider, setNewEvidenceProvider] = useState<
        CreateConfirmationViewModel | undefined
    >(undefined);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    const mutation = useAgsMutation(MutationType.CREATE_EVIDENCEPROVIDER, {
        onSuccess: (data: CreateEvidenceProviderResponse) => {
            setNewEvidenceProvider({
                apiKey: data.apiKey,
                evidenceProviderId: data.providerId,
                evidenceProviderName: data.name,
            });
            setShowApiKeyModal(true);
        },
        onError: (error: Error, _params: CreateEvidenceProviderParams) => {
            addNotification({
                id: uuid(),
                type: 'error',
                header: `Failed to record a new evidence provider with the provided details.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onSubmit = (formValues: Record<string, any>) => {
        const request: CreateEvidenceProviderParams = {
            name: formValues.name,
            providerId: formValues.providerId,
            description: formValues.description,
            schemas: formValues.schemas?.map((x: any) => {
                return { schemaId: x.schemaId, content: JSON.parse(x.content) };
            }),
        };

        setInput(formValues);
        mutation.mutate(request);
    };

    const onCancel = () => {
        history.goBack();
    };

    return (
        <Container>
            <CreateEvidenceProviderForm
                initialValues={input}
                onSubmit={onSubmit}
                onCancel={onCancel}
                isSubmitting={mutation.isLoading}
            />
            <CreateConfirmationModal
                onDismissed={history.goBack}
                setVisible={setShowApiKeyModal}
                visible={showApiKeyModal}
                evidenceProvider={newEvidenceProvider}
            />
        </Container>
    );
};

export default CreateEvidenceProvider;
