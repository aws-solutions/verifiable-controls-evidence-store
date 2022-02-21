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
import {
    QueryFunctionContext,
    QueryKey,
    useQuery,
    useInfiniteQuery,
    useQueries,
    DefaultOptions,
} from 'react-query';
import { ApiEndpoints, UserCredential } from '../types';
import { AgsPaginatedQueryResult } from './types';
import { QueryMap } from './queryBase';

export async function defaultQueryFn(
    queryContext: QueryFunctionContext<QueryKey, any>,
    queryMap: QueryMap,
    apiEndpoints?: ApiEndpoints,
    userCredential?: UserCredential
) {
    const queryType = queryContext.queryKey[0] as string;
    const queryConstructor = queryMap[queryType];

    if (!queryConstructor) {
        throw new Error(`Unable to find query ${queryType}`);
    }

    const query = new queryConstructor(userCredential!, apiEndpoints!);
    return query.query(queryContext.queryKey, queryContext.pageParam);
}

export function getQueryClientParameters(
    queryMap: QueryMap,
    userCredential?: UserCredential,
    apiEndpoints?: ApiEndpoints,
    setReauthenticate?: () => void
): {
    defaultOptions: DefaultOptions<unknown>;
} {
    return {
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                onError: (error: unknown) => {
                    console.log('onError called on default query function');
                    console.error(error);
                },
                retry: (failureCount: number, error: unknown) => {
                    const err = error as Error;
                    // if it is expire token, no retry and reauthenticate
                    if (
                        err.name === 'ExpiredTokenException' &&
                        err.message === 'Security Token expired'
                    ) {
                        if (setReauthenticate) {
                            setReauthenticate();
                        }
                        return false;
                    }

                    // other cases, retry twice
                    return failureCount < 2;
                },
                queryFn:
                    userCredential && apiEndpoints
                        ? (queryContext: QueryFunctionContext<QueryKey, any>) =>
                              defaultQueryFn(
                                  queryContext,
                                  queryMap,
                                  apiEndpoints,
                                  userCredential
                              )
                        : () => {},
            },
        },
    };
}

export function useAgsQuery<TData>(queryType: string, ...queryParams: string[]) {
    const keys: string[] = [queryType, ...queryParams];
    return useQuery<TData, Error>(keys);
}

// non-paginated list query. The result is an array of the TData type.
// It can be used to fetch the first page from the API or non-paginated lists.
// For paginated lists, InfinityQuery should be used.
export function useAgsListQuery<TData>(queryType: string, ...queryParams: string[]) {
    const keys: string[] = [queryType, ...queryParams];
    return useQuery<TData[], Error>(keys);
}

// infinite query
export function useAgsInfiniteQuery<
    TData extends AgsPaginatedQueryResult<{}>,
    TError = Error
>(queryType: string, ...queryParams: any[]) {
    const keys: any[] = [queryType, ...queryParams];
    return useInfiniteQuery<TData, TError>({
        keepPreviousData: true,
        queryKey: keys,
        getNextPageParam: (lastPage: TData, _: TData[]) => lastPage.nextToken,
    });
}

// batch query
export function useAgsBatchQuery<TData>(queryType: string, primaryKeys?: string[]) {
    const results = useQueries(
        (primaryKeys ?? []).map((key) => {
            return {
                queryKey: [queryType, key],
                enabled: !!primaryKeys,
            };
        })
    );

    const isLoading = results.map(({ isLoading }) => isLoading).some((x) => x);
    const isError = results.map(({ isError }) => isError).some((x) => x);

    const data = results.reduce((prevData, { data }) => {
        prevData.push(data as TData);
        return prevData;
    }, [] as TData[]);

    const errors = results.reduce((prevError, { error }) => {
        if (error) {
            prevError.push(error as Error);
        }
        return prevError;
    }, [] as Error[]);
    return { isLoading, isError, data, errors };
}
