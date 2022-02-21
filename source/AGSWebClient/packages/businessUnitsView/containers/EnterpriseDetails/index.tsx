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
import { useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';
import Stack from 'aws-northstar/layouts/Stack';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import Inline from 'aws-northstar/layouts/Inline';
import Button from 'aws-northstar/components/Button';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import PageError from '@ags/webclient-core/components/PageError';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import { ROUTE_DASHBOARD } from '@ags/webclient-core/config/routes';
import {
    useAgsQuery,
    useAgsBatchQuery,
    useAgsMutation,
} from '@ags/webclient-core/queries';
import {
    BusinessUnit,
    DeleteBusinessUnitParams,
    DeleteBusinessUnitResponse,
} from '@ags/webclient-business-units-core/types';
import { QueryType, MutationType } from '@ags/webclient-business-units-core/queries';

import EnterpriseDeleteConfirmationModal from '../../components/Enterprise/DeleteConfirmationModal';
import BusinessUnitDetailComponent from '../../components/BusinessUnits/Detail';
import BusinessUnitTable from '../../components/BusinessUnits/Table';

import { ROUTE_ENTERPRISE_UPDATE } from '@ags/webclient-business-units-core/config/routes';
import { PERMISSION_ENTERPRISE_MANAGE } from '@ags/webclient-business-units-core/config/permissions';

export interface EnterpriseDetailsProps {
    DashboardComponent?: ElementType;
}

const EnterpriseDetail: FunctionComponent<EnterpriseDetailsProps> = ({
    DashboardComponent,
}) => {
    const { addNotification } = useAppLayoutContext();
    const history = useHistory();

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    // get details of the enterprise
    const {
        isLoading,
        isError,
        error,
        data: enterprise,
    } = useAgsQuery<BusinessUnit>(QueryType.GET_BUSUSINESSUNIT, 'enterprise');

    // get all children unit
    const {
        isLoading: isLoadingChildBUs,
        isError: isErrorChildBUs,
        errors: errorsChildBUs,
        data: childBusinessUnits,
    } = useAgsBatchQuery<BusinessUnit>(
        QueryType.GET_BUSUSINESSUNIT,
        enterprise?.children
    );

    const mutation = useAgsMutation<
        DeleteBusinessUnitParams,
        DeleteBusinessUnitResponse,
        Error
    >(MutationType.DELETE_ENTERPRISE, {
        onSuccess: (data: DeleteBusinessUnitResponse) => {
            history.replace(ROUTE_DASHBOARD, {
                notifications: [
                    {
                        id: uuidv4(),
                        type: 'success',
                        header: `Delete Enterprise ${enterprise?.name} Succeeded.`,
                        dismissible: true,
                    },
                ],
            });
        },
        onError: (error: Error, params: DeleteBusinessUnitParams) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Delete Enterprise ${enterprise?.name} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
    });

    const onConfirmDelete = () => {
        console.log(`confirm delete ${enterprise?.name}`);
        if (enterprise) {
            mutation.mutate({ id: '' });
        }
    };

    const ActionButtons = useMemo(() => {
        return (
            <Inline>
                <HasGroups groups={PERMISSION_ENTERPRISE_MANAGE}>
                    <Button
                        onClick={() => {
                            setShowDeleteConfirmation(true);
                        }}
                        disabled={enterprise?.children.length !== 0}
                    >
                        Delete
                    </Button>
                </HasGroups>
                <HasGroups groups={PERMISSION_ENTERPRISE_MANAGE}>
                    <Button
                        onClick={() => {
                            history.push(ROUTE_ENTERPRISE_UPDATE);
                        }}
                    >
                        Edit
                    </Button>
                </HasGroups>
            </Inline>
        );
    }, [enterprise, history]);

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

    return (
        <QueryContainerTemplate
            loading={isLoading || isLoadingChildBUs}
            error={isError && error ? error : undefined}
            data={enterprise}
        >
            {(enterprise) => (
                <Stack>
                    <HeadingStripe
                        title={`${enterprise?.name} Enterprise`}
                        actionButtons={ActionButtons}
                    />
                    <BusinessUnitDetailComponent businessUnit={enterprise} />
                    {DashboardComponent && (
                        <DashboardComponent
                            entityType="BUSINESS_UNIT"
                            entityId={enterprise.id}
                        />
                    )}
                    <BusinessUnitTable
                        businessUnits={childBusinessUnits}
                        parentBusinessUnitId={enterprise?.id ?? ''}
                        disableToolbar={false}
                        disableCreate={false}
                        tableName={`Descendant Business Unit${
                            childBusinessUnits.length > 1 ? 's' : ''
                        } (${childBusinessUnits.length})`}
                    />
                    <EnterpriseDeleteConfirmationModal
                        enterpriseName={enterprise.name}
                        visible={showDeleteConfirmation}
                        setVisible={setShowDeleteConfirmation}
                        onConfirmed={onConfirmDelete}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default EnterpriseDetail;
