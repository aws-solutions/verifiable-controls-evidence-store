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
import { FunctionComponent, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import Stack from 'aws-northstar/layouts/Stack';
import {
    AgsPaginatedQueryResult,
    useAgsMutation,
    useAgsQuery,
} from '@ags/webclient-core/queries';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';

import EvidenceDetail from '@ags/webclient-evidence-view/components/Evidence/Detail';
import {
    Evidence,
    EvidenceVerificationStatus,
    GenerateAttachmentLinkParams,
    AttachmentLinkResponse,
} from '@ags/webclient-evidence-core/types';
import { MutationType, QueryType } from '@ags/webclient-evidence-core/queries/types';

const EvidenceDetailView: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();

    const { evidenceId } = useParams<{ evidenceId: string }>();

    const { revisionId } = useParams<{ revisionId: string }>();

    const {
        isLoading: isLoadingEvidence,
        isError: isErrorEvidence,
        error: errorEvidence,
        data: evidence,
    } = useAgsQuery<Evidence>(
        revisionId ? QueryType.GET_REVISION : QueryType.GET_EVIDENCE,
        evidenceId,
        revisionId
    );

    const { isLoading: isLoadingStatus, data: status } =
        useAgsQuery<EvidenceVerificationStatus>(
            revisionId
                ? QueryType.GET_REVISION_VERIFICATION_STATUS
                : QueryType.GET_EVIDENCE_VERIFICATION_STATUS,
            evidenceId,
            revisionId
        );

    const generateLink = useAgsMutation<
        AttachmentLinkResponse,
        GenerateAttachmentLinkParams,
        Error
    >(MutationType.GENERATE_ATTACHMENT_LINK, {
        onError: (error: Error, params: GenerateAttachmentLinkParams) => {
            addNotification({
                id: uuid(),
                type: 'error',
                header: `Failed to generate download link for ${params.attachmentId}`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const { data: evidenceRevisions, isLoading: isRevisionsLoading } = useAgsQuery<
        AgsPaginatedQueryResult<Evidence>
    >(QueryType.LIST_REVISIONS, evidenceId);

    const download = useCallback(
        async (attachmentId: string) => {
            const link = revisionId
                ? await generateLink.mutateAsync({ evidenceId, revisionId, attachmentId })
                : await generateLink.mutateAsync({
                      evidenceId,
                      attachmentId,
                  });

            window.open(link.url);
        },
        [evidenceId, revisionId, generateLink]
    );

    return (
        <QueryContainerTemplate
            loading={isLoadingEvidence || isLoadingStatus || isRevisionsLoading}
            error={isErrorEvidence && errorEvidence ? errorEvidence : undefined}
            data={evidence}
        >
            {(data) => (
                <Stack>
                    <HeadingStripe
                        title={revisionId ? 'Revision Details' : 'Evidence Details'}
                    />
                    <EvidenceDetail
                        showRevisions={revisionId === undefined}
                        evidence={data}
                        verified={status && status.verificationStatus === 'Verified'}
                        onDownloadClicked={download}
                        revisions={evidenceRevisions?.results}
                        revisionId={revisionId}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default EvidenceDetailView;
