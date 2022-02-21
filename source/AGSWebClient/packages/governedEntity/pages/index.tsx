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
import { FunctionComponent, useCallback, useState, useMemo } from 'react';
import { generatePath, useHistory } from 'react-router-dom';
import Stack from 'aws-northstar/layouts/Stack';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import Tabs from 'aws-northstar/components/Tabs';

import { useGovSuiteAppApi } from '@ags/webclient-core/containers/AppContext';
import { ROUTE_GOVERNED_ENTITY_UPDATE } from '@ags/webclient-governed-entity-core/config/routes';

import BusinessUnitListView from '@ags/webclient-governed-entity-view/containers/BusinessUnitList';
import EstateListView from '@ags/webclient-governed-entity-view/containers/EstateList';
import EnvironmentListView from '@ags/webclient-governed-entity-view/containers/EnvironmentList';
import EnvClassListView from '@ags/webclient-governed-entity-view/containers/EnvClassList';
import ApplicationListView from '@ags/webclient-governed-entity-view/containers/ApplicationList';
import AppAttributeListView from '@ags/webclient-governed-entity-view/containers/AppAttributeList';

export interface GovernedEntityAssociationProps {}

const GOVERNED_ENTITIES = [
    {
        id: 'businessUnit',
        name: 'Business Units',
        entityType: 'businessunit',
        component: BusinessUnitListView,
        requiredServices: ['AGSRiskManagementService'],
    },
    {
        id: 'estate',
        name: 'Estates',
        entityType: 'estate',
        component: EstateListView,
        requiredServices: ['AGSEstateManagementService'],
    },
    {
        id: 'environment',
        name: 'Environments',
        entityType: 'environment',
        component: EnvironmentListView,
        requiredServices: ['AGSEstateManagementService'],
    },
    {
        id: 'envclass',
        name: 'Environment Classes',
        entityType: 'envclass',
        component: EnvClassListView,
        requiredServices: ['AGSEstateManagementService'],
    },
    {
        id: 'application',
        name: 'Applications',
        entityType: 'application',
        component: ApplicationListView,
        requiredServices: ['AGSApplicationDefinitionService'],
    },
    {
        id: 'appattribute',
        name: 'Application Attributes',
        entityType: 'appattribute',
        component: AppAttributeListView,
        requiredServices: ['AGSApplicationDefinitionService'],
    },
];

const GovernedEntityAssociation: FunctionComponent<GovernedEntityAssociationProps> =
    () => {
        // filter all governed entity types through available services
        const { apiEndpoints } = useGovSuiteAppApi();
        const governedEntities = useMemo(() => {
            const availabeServices = Object.keys(apiEndpoints ?? []);
            return GOVERNED_ENTITIES.filter(({ requiredServices }) =>
                requiredServices.every((serviceName) =>
                    availabeServices.includes(serviceName)
                )
            );
        }, [apiEndpoints]);

        const history = useHistory();

        const [governedEntityType, setGovernedEntityType] = useState<string>(
            governedEntities[0].entityType
        );

        const onEditAssociation = useCallback(
            (selectedGovernedEntityId: string) => {
                console.log(governedEntityType, selectedGovernedEntityId);
                const path = generatePath(ROUTE_GOVERNED_ENTITY_UPDATE, {
                    entityType: governedEntityType,
                    entityId: selectedGovernedEntityId,
                });
                history.push(path);
            },
            [history, governedEntityType]
        );

        const handleTabChange = useCallback(
            (activeTabId: string) => {
                const selectedEntityType = governedEntities.find(
                    ({ id }) => id === activeTabId
                );
                if (
                    selectedEntityType &&
                    selectedEntityType.entityType !== governedEntityType
                ) {
                    console.debug(
                        `set entity type prev:${governedEntityType}, new: ${selectedEntityType.entityType}`
                    );
                    setGovernedEntityType(selectedEntityType.entityType);
                }
            },
            [governedEntities, governedEntityType]
        );

        const tabs = useMemo(
            () =>
                governedEntities.map((entity) => {
                    return {
                        label: entity.name,
                        id: entity.id,
                        content: (
                            <entity.component onEditAssociation={onEditAssociation} />
                        ),
                    };
                }),
            [governedEntities, onEditAssociation]
        );

        return (
            <Stack>
                <HeadingStripe title={'Manage Governed Entity Association'} />
                <Tabs tabs={tabs} variant="default" onChange={handleTabChange} />
            </Stack>
        );
    };
export default GovernedEntityAssociation;
