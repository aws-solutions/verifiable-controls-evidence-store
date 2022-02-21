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
import { FunctionComponent, useMemo, ElementType } from 'react';
import { useParams } from 'react-router-dom';
import Stack from 'aws-northstar/layouts/Stack';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import { useAgsQuery, useAgsListQuery } from '@ags/webclient-core/queries';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import { QueryType as BusinessUnitsQueryType } from '@ags/webclient-business-units-core/queries';
import { Estate } from '@ags/webclient-estates-core/types';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import { QueryType } from '@ags/webclient-estates-core/queries';
import EstateDetail from '../../components/Estates/Detail';
import EnvironmentsTable from '../../components/Environments/Table';

export interface EstateViewProps {
    DashboardComponent?: ElementType;
}

const EstateView: FunctionComponent<EstateViewProps> = ({ DashboardComponent }) => {
    const { estateId } = useParams<{ estateId: string }>();
    const {
        isLoading: isLoadingEstate,
        isError: isErrorEstate,
        error: errorEstate,
        data: estate,
    } = useAgsQuery<Estate>(QueryType.GET_ESTATE, estateId);

    const {
        isLoading: isLoadingBusinessUnits,
        data: businessUnits,
        isError: isErrorBusinessUnits,
    } = useAgsListQuery<BusinessUnitSummary>(BusinessUnitsQueryType.LIST_BUSINESSUNITS);

    const estateDisplay = useMemo(() => {
        if (estate) {
            const parentBUName = businessUnits
                ? businessUnits.find((bu) => bu.id === estate?.parentBUId)?.name
                : '';
            return {
                ...estate,
                parentBUName: parentBUName,
            };
        }
    }, [estate, businessUnits]);

    const isError = isErrorBusinessUnits || (isErrorEstate && errorEstate);

    const linkedEnvClasses = useMemo(() => {
        return estate?.environments?.reduce(
            (envClasses: string[], env) => [...envClasses, ...env.envClasses],
            []
        );
    }, [estate]);

    return (
        <QueryContainerTemplate
            loading={isLoadingEstate || isLoadingBusinessUnits}
            error={isError && errorEstate ? errorEstate : undefined}
            data={estateDisplay}
        >
            {(data) => (
                <Stack>
                    <HeadingStripe title={data?.name} />
                    <EstateDetail estate={estateDisplay} />
                    {DashboardComponent && (
                        <DashboardComponent
                            entityType="ESTATE"
                            entityId={data.id}
                            linkedEnvClasses={linkedEnvClasses}
                        />
                    )}
                    <EnvironmentsTable environments={data?.environments || []} />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default EstateView;
