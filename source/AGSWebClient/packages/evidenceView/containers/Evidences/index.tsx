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
import { FunctionComponent, useMemo, useCallback, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import Stack from 'aws-northstar/layouts/Stack';
import { FetchDataOptions } from 'aws-northstar/components/Table';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import {
    AgsPaginatedQueryResult,
    useAgsInfiniteQuery,
    useAgsListQuery,
} from '@ags/webclient-core/queries';
import EvidenceSearchForm from '../../components/Evidence/SearchForm';
import EvidencesTable from '../../components/Evidence/Table';
import { ROUTE_EVIDENCE_CREATE } from '@ags/webclient-evidence-core/config/routes';
import { Evidence, EvidenceProvider } from '@ags/webclient-evidence-core/types';
import { QueryType } from '@ags/webclient-evidence-core/queries/types';
import HeadingStripe from 'aws-northstar/components/HeadingStripe';
import Inline from 'aws-northstar/layouts/Inline';
import Button from 'aws-northstar/components/Button';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import { PERMISSION_EVIDENCE_MANAGE } from '@ags/webclient-evidence-core/config/permissions';

const EvidenceContainer: FunctionComponent = () => {
    const history = useHistory();
    const [evidences, setEvidences] = useState<Evidence[] | undefined>([]);
    const urlSearchParams = new URLSearchParams(useLocation().search);
    const targetIds = urlSearchParams.get('targetIds')?.split(',');
    const displayBackButton = urlSearchParams.get('returnUrl');
    const [initialValues] = useState(
        targetIds
            ? {
                  searchForm: {
                      targetIds: targetIds?.map((item) => ({
                          value: item,
                      })),
                  },
              }
            : undefined
    );

    const [queryFilter, setQueryFilter] = useState<Record<string, any>>({
        targetIds: initialValues?.searchForm?.targetIds?.map((item) => item.value),
    });

    const [rowCount, setRowcount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);

    const {
        data,
        hasNextPage,
        fetchNextPage,
        isLoading,
        error,
        isFetchingNextPage,
        isFetching,
    } = useAgsInfiniteQuery<AgsPaginatedQueryResult<Evidence>, Error>(
        QueryType.SEARCH_EVIDENCE,
        queryFilter
    );

    const { data: providers, isLoading: providerLoading } =
        useAgsListQuery<EvidenceProvider>(QueryType.LIST_EVIDENCE_PROVIDERS);

    const displayData = useCallback((dataToDisplay?: Evidence[], total?: number) => {
        setEvidences(dataToDisplay);
        setRowcount(total ?? 0);
    }, []);

    useMemo(() => {
        if (data) {
            const dataToDisplay = data?.pages?.[currentPage]?.results;
            displayData(dataToDisplay, data?.pages?.[0]?.total);
        }
    }, [data, currentPage, displayData]);

    const onSearch = (formData: Record<string, any>) => {
        const searchForm = formData.searchForm;
        // prepare search query
        const searchQuery = {
            providerId: searchForm?.providerId,
            schemaId: searchForm?.schemaId,
            content: searchForm?.content,
            targetIds: searchForm?.targetIds
                ?.filter((x: any) => x.value !== '')
                .map((x: any) => x.value),
            fromTimestamp: searchForm?.startTimestamp
                ? convertDate(searchForm.startTimestamp).toISOString()
                : undefined,
            toTimestamp: searchForm?.endTimestamp
                ? convertDate(searchForm.endTimestamp).toISOString()
                : undefined,
        };
        console.log(searchQuery);
        setQueryFilter(searchQuery);
        setCurrentPage(0);
    };

    const convertDate = (dateString: string) => {
        const date = new Date(dateString);

        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const onFetchData = (options: FetchDataOptions) => {
        const pageIndex = options.pageIndex ?? currentPage;

        if (hasNextPage && currentPage < pageIndex) {
            fetchNextPage();
        }

        if (pageIndex !== currentPage) {
            setCurrentPage(pageIndex);
            const dataToDisplay = data?.pages?.[pageIndex]?.results;
            if (dataToDisplay) {
                displayData(dataToDisplay, data?.pages?.[0]?.total);
            }
        }
    };

    const ActionButtons = useMemo(() => {
        return (
            <Inline>
                {displayBackButton ? (
                    <Button onClick={() => history.goBack()}>Back</Button>
                ) : (
                    <></>
                )}
                <HasGroups groups={PERMISSION_EVIDENCE_MANAGE}>
                    <Button
                        variant={'primary'}
                        onClick={() =>
                            history.push(ROUTE_EVIDENCE_CREATE, {
                                from: history.location.pathname,
                            })
                        }
                    >
                        Create an evidence
                    </Button>
                </HasGroups>
            </Inline>
        );
    }, [history, displayBackButton]);
    return (
        <Stack>
            <HeadingStripe title="Evidence history" actionButtons={ActionButtons} />
            <p>View and search for your historical evidence</p>
            <EvidenceSearchForm
                onSearch={onSearch}
                evidenceProviders={providers}
                initialValues={initialValues}
                isSubmitting={isLoading}
            />
            <QueryContainerTemplate
                loading={isLoading || providerLoading}
                error={error ?? undefined}
                data={evidences}
            >
                {() => {
                    return (
                        <EvidencesTable
                            evidences={evidences}
                            total={rowCount}
                            onFetchData={onFetchData}
                            isLoading={
                                isLoading ||
                                providerLoading ||
                                isFetchingNextPage ||
                                isFetching
                            }
                        />
                    );
                }}
            </QueryContainerTemplate>
        </Stack>
    );
};

export default EvidenceContainer;
