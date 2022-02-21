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
import { FunctionComponent, useMemo, useState } from 'react';
import { useHistory, generatePath } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import PageError from '@ags/webclient-core/components/PageError';
import PageLoading from '@ags/webclient-core/components/PageLoading';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';

import CreateEvidenceForm, {
    CreateEvidenceParams,
} from '@ags/webclient-evidence-view/components/Evidence/CreateForm';
import {
    EvidenceProvider,
    CreateEvidenceParams as CreateEvidenceRequest,
    CreateEvidenceResponse,
    FileUploadParams,
} from '@ags/webclient-evidence-core/types';
import { QueryType, MutationType } from '@ags/webclient-evidence-core/queries/types';
import { useMutation } from 'react-query';
import { uploadAttachment } from '@ags/webclient-evidence-core/queries/mutations/uploadAttachment';
import { useGovSuiteAppApi } from '@ags/webclient-core/containers/AppContext';
import { ROUTE_EVIDENCE_DETAIL } from '@ags/webclient-evidence-core/config/routes';

const CreateEvidence: FunctionComponent = () => {
    const history = useHistory();
    const { addNotification } = useAppLayoutContext();

    const [input, setInput] = useState<CreateEvidenceParams>();
    const { data, isLoading, isError } = useAgsListQuery<EvidenceProvider>(
        QueryType.LIST_EVIDENCE_PROVIDERS
    );

    const [done, setDone] = useState(false);

    const initialValues = useMemo(() => input, [input]);

    const { userCredential } = useGovSuiteAppApi();

    const fileUpload = useMutation<string, Error, FileUploadParams>(
        (params: FileUploadParams): Promise<string> => uploadAttachment(params),
        {
            onError: (error: Error, params: FileUploadParams) => {
                addNotification({
                    id: uuid(),
                    type: 'error',
                    header: `Failed to upload ${params.file.name}.`,
                    content: error.message,
                    dismissible: true,
                });
            },
        }
    );

    const mutation = useAgsMutation<CreateEvidenceResponse, CreateEvidenceRequest, Error>(
        MutationType.CREATE_EVIDENCE,
        {
            onSuccess: (createEvidenceResponse: CreateEvidenceResponse) => {
                setDone(true);
                addNotification({
                    id: uuid(),
                    type: 'success',
                    header: `Successfully recorded evidence with id ${createEvidenceResponse.evidenceId}.`,
                    buttonText: 'View Evidence',
                    onButtonClick: () =>
                        history.push(
                            generatePath(ROUTE_EVIDENCE_DETAIL, {
                                evidenceId: createEvidenceResponse.evidenceId,
                            })
                        ),
                });
                setTimeout(() => {
                    history.push(
                        generatePath(ROUTE_EVIDENCE_DETAIL, {
                            evidenceId: createEvidenceResponse.evidenceId,
                        })
                    );
                }, 5000);
            },
            onError: (error: Error, _params: CreateEvidenceRequest) => {
                addNotification({
                    id: uuid(),
                    type: 'error',
                    header: `Failed to record the provided evidence.`,
                    content: error.message,
                    dismissible: true,
                });
            },
        }
    );

    const onSubmit = async (formValues: Record<string, any>) => {
        const sessionId = uuid(); // unique id to prevent file overwrite
        console.debug('on submit', formValues);
        const params: FileUploadParams[] = [];

        let objectKeys: string[] | undefined = undefined;

        if (formValues.attachments) {
            formValues.attachments.forEach((x: any) => {
                params.push({
                    file: x.filePath.inputFiles[0],
                    sessionId,
                    userCredential: userCredential!,
                });
            });
        }

        console.debug(`number of files to upload`, params.length);

        if (params.length > 0) {
            objectKeys = await Promise.all(params.map((x) => fileUpload.mutateAsync(x)));
        }

        const request: CreateEvidenceRequest = {
            apiKey: formValues.apiKey,
            providerId: formValues.providerId,
            content: JSON.parse(formValues.content),
            schemaId: formValues.schemaId,
            targetId: formValues.targetId,
            attachments: objectKeys?.map((x) => {
                return { objectKey: x };
            }),
            additionalTargetIds: formValues.additionalTargetIds?.map((x: any) => x.value),
        };

        setInput({ ...formValues, attachments: formValues.attachments });
        mutation.mutate(request);
    };

    const onCancel = () => {
        history.goBack();
    };

    if (isError) {
        return <PageError />;
    }

    if (isLoading) {
        return <PageLoading />;
    }

    return (
        <CreateEvidenceForm
            initialValues={initialValues}
            providers={data}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isSubmitting={fileUpload.isLoading || mutation.isLoading || done}
        />
    );
};

export default CreateEvidence;
