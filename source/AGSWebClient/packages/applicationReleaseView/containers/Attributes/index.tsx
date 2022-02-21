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
import { v4 as uuidv4 } from 'uuid';
import Stack from 'aws-northstar/layouts/Stack';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import { useAgsListQuery, useAgsMutation } from '@ags/webclient-core/queries';
import {
    AttributeSummary,
    DeleteAttributeParams,
    DeleteAttributeResponse,
} from '@ags/webclient-application-release-core/types';
import { QueryType, MutationType } from '@ags/webclient-application-release-core/queries';
import AttributesTable from '../../components/Attributes/Table';
import AttributeDeleteConfirmationModal from '../../components/Attributes/DeleteConfirmationModal';

const AttributesContainer: FunctionComponent = () => {
    const { addNotification } = useAppLayoutContext();

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [attributeToBeDeleted, setAttributeToBeDeleted] = useState<AttributeSummary>();

    // load attributes
    const { isLoading, data, isError, error } = useAgsListQuery<AttributeSummary>(
        QueryType.LIST_ALL_ATTRIBUTES
    );

    const mutation = useAgsMutation<
        DeleteAttributeResponse,
        DeleteAttributeParams,
        Error
    >(MutationType.DELETE_ATTRIBUTE, {
        onSuccess: (data: DeleteAttributeResponse) => {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            addNotification({
                id: uuidv4(),
                type: 'success',
                header: `Delete Attribute ${attributeToBeDeleted?.name} Succeeded.`,
                dismissible: true,
            });

            setAttributeToBeDeleted(undefined);
        },
        onError: (error: Error, params: DeleteAttributeParams) => {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Attribute ${attributeToBeDeleted?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onDelete = (selectedAttributes: AttributeSummary[]) => {
        setAttributeToBeDeleted(selectedAttributes[0]);
        setShowDeleteConfirmation(true);
    };

    const onConfirmDelete = () => {
        if (attributeToBeDeleted) {
            setIsDeleting(true);
            mutation.mutate({ name: attributeToBeDeleted.name });
        }
    };

    return (
        <QueryContainerTemplate
            loading={isLoading}
            error={isError && error ? error : undefined}
            data={data}
        >
            {(data) => {
                return (
                    <Stack>
                        <AttributesTable
                            attributes={data}
                            disableRowSelect={false}
                            onDeleteAttribute={onDelete}
                        />
                        <AttributeDeleteConfirmationModal
                            attributeName={attributeToBeDeleted?.name ?? ''}
                            visible={showDeleteConfirmation}
                            setVisible={setShowDeleteConfirmation}
                            onConfirmed={onConfirmDelete}
                            isDeleting={isDeleting}
                        />
                    </Stack>
                );
            }}
        </QueryContainerTemplate>
    );
};

export default AttributesContainer;
