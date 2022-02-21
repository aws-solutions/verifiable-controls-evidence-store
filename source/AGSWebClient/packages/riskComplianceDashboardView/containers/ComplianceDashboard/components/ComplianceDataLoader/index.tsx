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
import { FunctionComponent, ReactElement, useMemo, useState } from 'react';
import PageLoading from '@ags/webclient-core/components/PageLoading';
import PageError from '@ags/webclient-core/components/PageError';
import DataNotAvailableIndicator from '../../../../components/ComplianceDashboard/DataNotAvailableIndicator';
import { CompliancePosture } from '@ags/webclient-compliance-core/types';
import { ComplianceDataType } from '../../../../components/ComplianceDashboard/types';
import { useAgsListQuery } from '@ags/webclient-core/queries';
import processData from '../../utils/processData';
import { QueryType } from '@ags/webclient-compliance-core/queries';

export interface ComplianceDataLoaderProps {
    children: (data: ComplianceDataType, rawData: CompliancePosture[]) => ReactElement;
    envClass: string;
    entityType: string;
    entityId: string;
}

const ComplianceDataLoader: FunctionComponent<ComplianceDataLoaderProps> = ({
    children,
    entityType,
    entityId,
    envClass,
}) => {
    const [resultError, setResultError] = useState(false);
    const { isLoading, data, isError } = useAgsListQuery<CompliancePosture>(
        QueryType.GET_COMPLIANCE_POSTURE,
        entityType,
        entityId,
        envClass
    );

    const complianceData = useMemo(() => {
        if (data && !Array.isArray(data)) {
            setResultError(true);
            return undefined;
        } else {
            setResultError(false);
        }

        return (data && data.length > 0 && processData(data)) || undefined;
    }, [data]);

    if (isLoading) {
        return <PageLoading />;
    }

    if (isError || resultError) {
        return <PageError />;
    }

    if (!complianceData) {
        return data?.length === 0 ? (
            <DataNotAvailableIndicator envClass={envClass} />
        ) : null;
    }

    return children(complianceData, data || []);
};

export default ComplianceDataLoader;
