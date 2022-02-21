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
import { FunctionComponent, useMemo, ReactElement } from 'react';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import { Application } from '@ags/webclient-applications-core/types';
import { Estate, Environment } from '@ags/webclient-estates-core/types';
import { QueryType as BUQueryType } from '@ags/webclient-business-units-core/queries';
import { QueryType as ApplicationQueryType } from '@ags/webclient-applications-core/queries';
import { QueryType as EstateQueryType } from '@ags/webclient-estates-core/queries';
import { useAgsListQuery, useAgsBatchQuery } from '@ags/webclient-core/queries';
import {
    ComplianceDataType,
    EntityMaps,
} from '../../../../components/ComplianceDashboard/types';

export interface MetadataLoaderProps {
    children: (entityMaps: EntityMaps) => ReactElement;
    data: ComplianceDataType;
}

const useMetaDataLoader = <T extends Application | Estate | BusinessUnitSummary>(
    queryType: string,
    ids: string[],
    getId: (d: T) => string
): [{ [id: string]: T }, T[]] => {
    const { isLoading, data, isError } = useAgsBatchQuery<T>(queryType, ids);

    const dataMap = useMemo(() => {
        if (isLoading || isError) {
            return {};
        }

        return (
            data?.reduce((map, d) => {
                return {
                    ...map,
                    [getId(d)]: d,
                } as { [id: string]: T };
            }, {}) || {}
        );
    }, [isLoading, data, isError, getId]);

    return [dataMap, data];
};

const MetadataLoader: FunctionComponent<MetadataLoaderProps> = ({ children, data }) => {
    const {
        isLoading: isListBusinessUnitLoading,
        data: businessUnits,
        isError: isListBusinessUnitError,
    } = useAgsListQuery<BusinessUnitSummary>(BUQueryType.LIST_BUSINESSUNITS);

    const businessUnitsMap: { [id: string]: BusinessUnitSummary } = useMemo(() => {
        if (isListBusinessUnitLoading || isListBusinessUnitError) {
            return {};
        }

        return (
            businessUnits?.reduce((map, bu) => {
                return {
                    ...map,
                    [bu.id]: bu,
                } as { [id: string]: BusinessUnitSummary };
            }, {}) || {}
        );
    }, [isListBusinessUnitLoading, isListBusinessUnitError, businessUnits]);

    const [estatesMap, estates] = useMetaDataLoader<Estate>(
        EstateQueryType.GET_ESTATE,
        data.estates.map((e) => e.id),
        (d) => d.id
    );
    const [applicationsMap] = useMetaDataLoader<Application>(
        ApplicationQueryType.GET_APPLICATION,
        data.applications.map((e) => e.id),
        (d) => d.name
    );
    const environmentsMap = useMemo(() => {
        const environmentsMap: { [id: string]: Environment } = {};
        estates?.forEach((e) => {
            e?.environments?.forEach((env) => {
                environmentsMap[env.id] = env;
            });
        });
        return environmentsMap;
    }, [estates]);

    return children({
        businessUnitsMap,
        estatesMap,
        applicationsMap,
        environmentsMap,
    });
};

export default MetadataLoader;
