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
import { v4 as uuidv4 } from 'uuid';

import Stack from 'aws-northstar/layouts/Stack';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import { useAppLayoutContext } from 'aws-northstar/layouts/AppLayout';

import PageError from '@ags/webclient-core/components/PageError';
import GovernedEntityAssociationView from '@ags/webclient-governed-entity-view/containers/Association';
import BusinessUnitAssociationDetails from '@ags/webclient-governed-entity-view/containers/BusinessUnit';
import EstateAssociationDetails from '@ags/webclient-governed-entity-view/containers/Estate';
import EnvironmentAssociationDetails from '@ags/webclient-governed-entity-view/containers/Environment';
import EnvClassAssociationDetails from '@ags/webclient-governed-entity-view/containers/EnvClass';
import ApplicationAssociationDetails from '@ags/webclient-governed-entity-view/containers/Application';
import AppAttributeAssociationDetails from '@ags/webclient-governed-entity-view/containers/AppAttribute';

const goveredEntityComponents = [
    {
        entityType: 'businessunit',
        component: BusinessUnitAssociationDetails,
    },
    {
        entityType: 'estate',
        component: EstateAssociationDetails,
    },
    {
        entityType: 'environment',
        component: EnvironmentAssociationDetails,
    },
    {
        entityType: 'envclass',
        component: EnvClassAssociationDetails,
    },
    {
        entityType: 'application',
        component: ApplicationAssociationDetails,
    },
    {
        entityType: 'appattribute',
        component: AppAttributeAssociationDetails,
    },
];

export interface GovernedEntityAssociationProps {}
const GovernedEntityUpdate: FunctionComponent<GovernedEntityAssociationProps> = () => {
    const { addNotification } = useAppLayoutContext();
    const { entityType } = useParams<{ entityType: string }>();
    const { entityId } = useParams<{ entityId: string }>();

    const DetailComponent =
        goveredEntityComponents.find(({ entityType: type }) => type === entityType)
            ?.component ?? PageError;

    const onUpdateSuccess = useCallback(
        (data) => {
            addNotification({
                id: uuidv4(),
                type: 'success',
                header: `Update associations on Governed Entity ${data.entityType} Succeeded.`,
                dismissible: true,
            });
        },
        [addNotification]
    );

    const onUpdateFailure = useCallback(
        (error, params) => {
            addNotification({
                id: uuidv4(),
                type: 'error',
                header: `Update associations on Governed Entity ${params.entityType} Failed.`,
                content: error.message,
                dismissible: true,
            });
        },
        [addNotification]
    );

    return (
        <Stack>
            <HeadingStripe title={'Update Governed Entity Association'} />
            <DetailComponent entityId={entityId} />
            <GovernedEntityAssociationView
                entityType={entityType}
                entityId={entityId}
                onUpdateSuccess={onUpdateSuccess}
                onUpdateFailure={onUpdateFailure}
            />
        </Stack>
    );
};
export default GovernedEntityUpdate;
