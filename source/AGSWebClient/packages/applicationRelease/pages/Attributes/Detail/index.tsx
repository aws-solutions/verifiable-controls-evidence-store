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
import { useParams, generatePath, useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import Stack from 'aws-northstar/layouts/Stack';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import Inline from 'aws-northstar/layouts/Inline';
import Button from 'aws-northstar/components/Button';

import {
    Attribute,
    DeleteAttributeParams,
    DeleteAttributeResponse,
} from '@ags/webclient-application-release-core/types';
import { QueryType, MutationType } from '@ags/webclient-application-release-core/queries';
import { useAgsQuery, useAgsMutation } from '@ags/webclient-core/queries';
import HasGroups from '@ags/webclient-core/components/HasGroups';

import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';

import AttributeDeleteConfirmationModal from '@ags/webclient-application-release-view/components/Attributes/DeleteConfirmationModal';
import AttributeDetailComponent from '@ags/webclient-application-release-view/components/Attributes/Detail';
import MetadataTable from '@ags/webclient-application-release-view/components/Attributes/Table/MetaData';
import {
    ROUTE_ATTRIBUTE_UPDATE,
    ROUTE_ATTRIBUTES_VIEW,
} from '@ags/webclient-application-release-core/config/routes';
import { PERMISSION_APPLICATION_MANAGE } from '@ags/webclient-application-release-core/config/permissions';

const AttributeDetail: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();
    const history = useHistory();

    const { attributeId } = useParams<{ attributeId: string }>();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const {
        isLoading,
        isError,
        error,
        data: attribute,
    } = useAgsQuery<Attribute>(QueryType.GET_ATTRIBUTE, attributeId);

    const mutation = useAgsMutation<
        DeleteAttributeResponse,
        DeleteAttributeParams,
        Error
    >(MutationType.DELETE_ATTRIBUTE, {
        onSuccess: (data: DeleteAttributeResponse) => {
            history.replace(ROUTE_ATTRIBUTES_VIEW, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Delete Attribute ${attribute?.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: DeleteAttributeParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Attribute ${attribute?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onConfirmDelete = () => {
        console.log(`confirm delete ${attribute?.name}`);
        if (attribute) {
            mutation.mutate({ name: attribute?.name });
        }
    };

    const ActionButtons = useMemo(() => {
        const path = generatePath(ROUTE_ATTRIBUTE_UPDATE, {
            attributeId: attributeId,
        });

        return (
            <Inline>
                <HasGroups groups={PERMISSION_APPLICATION_MANAGE}>
                    <Button
                        onClick={() => {
                            setShowDeleteConfirmation(true);
                        }}
                    >
                        Delete
                    </Button>
                </HasGroups>
                <HasGroups groups={PERMISSION_APPLICATION_MANAGE}>
                    <Button
                        onClick={() => {
                            history.push(path);
                        }}
                    >
                        Edit
                    </Button>
                </HasGroups>
            </Inline>
        );
    }, [attributeId, history]);

    return (
        <QueryContainerTemplate
            loading={isLoading}
            error={isError && error ? error : undefined}
            data={attribute}
        >
            {(attribute) => (
                <Stack>
                    <HeadingStripe
                        title={attribute?.name ?? ''}
                        actionButtons={ActionButtons}
                    />
                    <AttributeDetailComponent attribute={attribute} />
                    <MetadataTable
                        metadata={attribute.metadata}
                        disableCreate={true}
                        disableRowSelect={true}
                        disableToolbar={true}
                        disableDelete={true}
                    />
                    <AttributeDeleteConfirmationModal
                        attributeName={attribute.name}
                        visible={showDeleteConfirmation}
                        setVisible={setShowDeleteConfirmation}
                        onConfirmed={onConfirmDelete}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default AttributeDetail;
