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
import { FunctionComponent, useEffect, useState, useMemo } from 'react';
import isEqual from 'lodash.isequal';
import { RestrictedSideNavigationItem } from '@ags/webclient-core/types';
import { QueryType } from '@ags/webclient-business-units-core/queries';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import { useAgsListQuery } from '@ags/webclient-core/queries';
import { buildBusinessUnitsNav } from './utils/buildBusinessUnitsNav';
import { ProcessorProps } from '@ags/webclient-core/components/ProcessorList';

const NavTemplateProcessor: FunctionComponent<
    ProcessorProps<RestrictedSideNavigationItem[]>
> = ({ settings, children }) => {
    const [businessUnits, setBusinessUnits] = useState<BusinessUnitSummary[]>([]);

    const { isLoading, data, isError } = useAgsListQuery<BusinessUnitSummary>(
        QueryType.LIST_BUSINESSUNITS
    );

    useEffect(() => {
        if (!isLoading && !isError && data) {
            if (!isEqual(businessUnits, data)) {
                setBusinessUnits(data);
            }
        }
    }, [data, isLoading, isError, businessUnits]);

    const updatedSettings = useMemo(() => {
        const nav = buildBusinessUnitsNav(businessUnits);
        return [nav, ...settings];
    }, [businessUnits, settings]);

    return children(updatedSettings);
};

export default NavTemplateProcessor;
