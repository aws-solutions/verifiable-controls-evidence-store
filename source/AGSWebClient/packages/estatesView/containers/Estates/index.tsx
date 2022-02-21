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
import { FunctionComponent, useMemo, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import Stack from 'aws-northstar/layouts/Stack';
import { FetchDataOptions } from 'aws-northstar/components/Table';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import { QueryType as BusinessUnitQueryType } from '@ags/webclient-business-units-core/queries';
import {
    useAgsListQuery,
    useAgsInfiniteQuery,
    AgsPaginatedQueryResult,
} from '@ags/webclient-core/queries';
import { Estate, EstateDisplay } from '@ags/webclient-estates-core/types';
import EstateTable from '../../components/Estates/Table';
import {
    ROUTE_ENVCLASSES_VIEW,
    ROUTE_ESTATE_REQUEST_FROM_ESTATES,
} from '@ags/webclient-estates-core/config/routes';
import { QueryType } from '@ags/webclient-estates-core/queries';

const pageSize = 10;

const EstatesContainer: FunctionComponent = () => {
    const history = useHistory();
    const [firstTime, setFirstTime] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [rowCount, setRowCount] = useState(0);
    const [estates, setEstates] = useState<Estate[] | undefined>();

    const {
        isLoading: isLoadingEstates,
        data,
        error: errorEstates,
        isError: isErrorEstates,
        fetchNextPage,
        hasNextPage,
    } = useAgsInfiniteQuery<AgsPaginatedQueryResult<Estate>, Error>(
        QueryType.LIST_ESTATES,
        pageSize * 2
    );

    const {
        isLoading: isLoadingBusinessUnits,
        data: businessUnits,
        isError: isErrorBusinessUnits,
    } = useAgsListQuery<BusinessUnitSummary>(BusinessUnitQueryType.LIST_BUSINESSUNITS);

    const prepareEstateDisplayData = useCallback(
        (estates?: Estate[]): EstateDisplay[] | undefined => {
            if (!estates) {
                return undefined;
            }

            let businessUnitMap = new Map<string, string>();
            if (businessUnits) {
                businessUnits.forEach((bu) => {
                    businessUnitMap.set(bu.id, bu.name);
                });
            }

            return estates.map((x) => ({
                ...x,
                parentBUName: businessUnitMap.get(x.parentBUId) ?? '',
            }));
        },
        [businessUnits]
    );

    useMemo(() => {
        if (firstTime) {
            const displayData = prepareEstateDisplayData(
                data?.pages.flatMap((p) => p.results).splice(0, pageSize)
            );
            setEstates(displayData);
            setRowCount(data?.pages.flatMap((p) => p.results).length ?? 0);

            if (estates && businessUnits) {
                setFirstTime(false);
            }
        }
    }, [data, businessUnits, firstTime, estates, prepareEstateDisplayData]);

    const getData = useCallback(
        async (options: FetchDataOptions) => {
            const requestedPage = options.pageIndex ?? currentPage;
            const requestedPageSize = options.pageSize ?? pageSize;

            if (hasNextPage && currentPage < requestedPage) {
                const result = await fetchNextPage();
                setRowCount(
                    result.data?.pages.flatMap((x) => x.results).length ?? pageSize
                );
            }

            if (currentPage !== requestedPage) {
                const displayData = prepareEstateDisplayData(
                    data?.pages
                        .flatMap((p) => p.results)
                        .splice(requestedPage * requestedPageSize, requestedPageSize)
                );
                setEstates(displayData);
                setCurrentPage(requestedPage);
            }
        },
        [currentPage, fetchNextPage, data?.pages, hasNextPage, prepareEstateDisplayData]
    );

    const isError = isErrorBusinessUnits || (isErrorEstates && errorEstates);

    return (
        <QueryContainerTemplate
            data={estates}
            loading={isLoadingBusinessUnits || isLoadingEstates}
            error={isError && errorEstates ? errorEstates : undefined}
        >
            {() => (
                <Stack>
                    <EstateTable
                        estates={estates}
                        onCreate={() => {
                            history.push(ROUTE_ESTATE_REQUEST_FROM_ESTATES, {
                                from: history.location.pathname,
                            });
                        }}
                        onEnvClassesMgr={() => {
                            history.push(ROUTE_ENVCLASSES_VIEW);
                        }}
                        rowCount={rowCount}
                        defaultPageSize={pageSize}
                        getData={getData}
                    />
                </Stack>
            )}
        </QueryContainerTemplate>
    );
};

export default EstatesContainer;
