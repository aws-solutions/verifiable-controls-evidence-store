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
import { FunctionComponent, useMemo, useState, ElementType } from 'react';
import { useParams, generatePath, useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import Stack from 'aws-northstar/layouts/Stack';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import Inline from 'aws-northstar/layouts/Inline';
import Button from 'aws-northstar/components/Button';

import PageError from '@ags/webclient-core/components/PageError';
import {
    useAgsQuery,
    useAgsBatchQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import {
    BusinessUnit,
    DeleteBusinessUnitParams,
    DeleteBusinessUnitResponse,
} from '@ags/webclient-business-units-core/types';
import { QueryType, MutationType } from '@ags/webclient-business-units-core/queries';

import DeleteConfirmationDialog from '../../components/BusinessUnits/DeleteConfirmationModal';
import BusinessUnitDetailComponent from '../../components/BusinessUnits/Detail';
import BusinessUnitTable from '../../components/BusinessUnits/Table';

import {
    ROUTE_BUSINESS_UNIT_UPDATE,
    ROUTE_BUSINESS_UNIT_DETAILS,
} from '@ags/webclient-business-units-core/config/routes';
import { PERMISSION_BUSINESS_UNIT_MANAGE } from '@ags/webclient-business-units-core/config/permissions';

export interface BusinessUnitDetailsProps {
    DashboardComponent?: ElementType;
}

const BusinessUnitDetails: FunctionComponent<BusinessUnitDetailsProps> = ({
    DashboardComponent,
}) => {
    const { addNotification } = useAppLayoutContext();
    const history = useHistory();

    const { businessUnitId } = useParams<{ businessUnitId: string }>();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // get details of the business unit
    const {
        isLoading,
        isError,
        error,
        data: businessUnit,
    } = useAgsQuery<BusinessUnit>(QueryType.GET_BUSUSINESSUNIT, businessUnitId);

    // get details of the parent business unit
    const {
        isLoading: isLoadingParentBU,
        isError: isErrorParentBU,
        error: errorParentBU,
        data: parentBusinessUnit,
    } = useAgsQuery<BusinessUnit>(
        QueryType.GET_BUSUSINESSUNIT,
        businessUnit?.parentId ?? ''
    );

    // get all children unit
    const {
        isLoading: isLoadingChildBUs,
        isError: isErrorChildBUs,
        errors: errorsChildBUs,
        data: childBusinessUnits,
    } = useAgsBatchQuery<BusinessUnit>(
        QueryType.GET_BUSUSINESSUNIT,
        businessUnit?.children
    );

    const mutation = useAgsMutation<
        DeleteBusinessUnitParams,
        DeleteBusinessUnitResponse,
        Error
    >(MutationType.DELETE_BUSINESSUNIT, {
        onSuccess: (data: DeleteBusinessUnitResponse) => {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            history.replace(
                generatePath(ROUTE_BUSINESS_UNIT_DETAILS, {
                    businessUnitId: parentBusinessUnit?.id ?? '',
                }),
                {
                    notifications: [
                        {
                            id: uuidv4(),
                            type: 'success',
                            header: `Delete Business Unit ${businessUnit?.name} Succeeded.`,
                            dismissible: true,
                        },
                    ],
                }
            );
        },
        onError: (error: Error, params: DeleteBusinessUnitParams) => {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Business Unit ${businessUnit?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onConfirmDelete = () => {
        if (businessUnit) {
            setIsDeleting(true);
            mutation.mutate({ id: businessUnit?.id });
        }
    };

    const ActionButtons = useMemo(() => {
        const path = businessUnit
            ? generatePath(ROUTE_BUSINESS_UNIT_UPDATE, {
                  businessUnitId: businessUnit.id,
              })
            : '';
        return (
            <Inline>
                <HasGroups groups={PERMISSION_BUSINESS_UNIT_MANAGE}>
                    <Button
                        onClick={() => {
                            setShowDeleteConfirmation(true);
                        }}
                        disabled={businessUnit?.children.length !== 0}
                    >
                        Delete
                    </Button>
                </HasGroups>

                <HasGroups groups={PERMISSION_BUSINESS_UNIT_MANAGE}>
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
    }, [businessUnit, history]);

    if (!isLoadingChildBUs && isErrorChildBUs) {
        const op = (prevMessage: string, error?: Error) => {
            return `${prevMessage}${prevMessage.length !== 0 ? '\n' : ''}${
                error?.message
            }`;
        };
        const message = errorsChildBUs.reduce(op, '');
        return (
            <PageError
                header="Error occurs on loading descendant Business Units"
                message={message}
            />
        );
    }

    if (!isLoadingParentBU && isErrorParentBU) {
        return (
            <PageError
                header="Error occurs on loading parent Business Unit"
                message={errorParentBU?.message}
            />
        );
    }

    return (
        <QueryContainerTemplate
            loading={isLoading || isLoadingParentBU || isLoadingChildBUs}
            error={isError && error ? error : undefined}
            data={businessUnit}
        >
            {(businessUnit) => (
                <Stack>
                    <HeadingStripe
                        title={
                            businessUnit?.name +
                            (businessUnit?.unitType === 'Enterprise' ? ' Enterprise' : '')
                        }
                        actionButtons={ActionButtons}
                    />
                    <BusinessUnitDetailComponent
                        businessUnit={businessUnit}
                        parentBusinessUnit={parentBusinessUnit}
                    />
                    {DashboardComponent && (
                        <DashboardComponent
                            entityType="BUSINESS_UNIT"
                            entityId={businessUnitId}
                        />
                    )}
                    <BusinessUnitTable
                        businessUnits={childBusinessUnits}
                        parentBusinessUnitId={businessUnit?.id ?? ''}
                        disableToolbar={false}
                        disableCreate={false}
                        tableName={`Descendant Business Unit${
                            childBusinessUnits.length > 1 ? 's' : ''
                        } (${childBusinessUnits.length})`}
                    />
                    <DeleteConfirmationDialog
                        businessUnitName={businessUnit?.name}
                        visible={showDeleteConfirmation}
                        setVisible={setShowDeleteConfirmation}
                        onConfirmed={onConfirmDelete}
                        isDeleting={isDeleting}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default BusinessUnitDetails;
