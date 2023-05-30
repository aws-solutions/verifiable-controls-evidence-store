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
    useQuery,
    useInfiniteQuery,
    useQueries,
    QueryFunctionContext,
} from 'react-query';
import { QueryBase, AgsApiOptions } from '@ags/webclient-core/queries';
import {
    useAgsQuery,
    useAgsListQuery,
    useAgsInfiniteQuery,
    useAgsBatchQuery,
    defaultQueryFn,
    getQueryClientParameters,
} from '@ags/webclient-core/queries';
import { invokeAgsApi } from './agsApi';
import { ExpiredTokenException, AgsPaginatedQueryResult } from './types';

jest.mock('react-query');
jest.mock('./agsApi', () => {
    return {
        invokeAgsApi: jest.fn(),
    };
});

const mockUseQuery = useQuery as jest.Mock<any>;
const mockUseInfiniteQuery = useInfiniteQuery as jest.Mock<any>;
const mockUseQueries = useQueries as jest.Mock<any>;

const mockInvokeAgsApi = invokeAgsApi as jest.Mock<any>;

type TestData = {
    value: string;
};

class TestQuery extends QueryBase<TestData> {
    createRequest(queryKey: string[]): AgsApiOptions {
        return {
            serviceName: 'TestService',
            pathTemplate: 'testkeys/{id}',
            pathParameters: { id: queryKey[1] },
            method: 'GET',
        };
    }
}

class TestQueryGetAll extends TestQuery {
    // fetch all pages at once
    shouldFetchAllPages(): boolean {
        return true;
    }
}

const queryMap = {
    TestQuery: TestQuery,
    TestQueryGetAll: TestQueryGetAll,
};

const serviceEndpoints = {
    TestService: 'https://TestService',
};

const userCredentials = {
    region: 'ap-southeast-1',
    accessKeyId: 'abc',
    secretAccessKey: 'def',
    sessionToken: 'uvwxyz',
};

mockUseQuery.mockImplementation((keys) => {
    return defaultQueryFn(
        { queryKey: keys } as unknown as QueryFunctionContext,
        queryMap,
        serviceEndpoints,
        userCredentials
    );
});

mockUseInfiniteQuery.mockImplementation((params) => {
    return defaultQueryFn(
        { queryKey: params.queryKey } as unknown as QueryFunctionContext,
        queryMap,
        serviceEndpoints,
        userCredentials
    );
});

mockUseQueries.mockImplementation((keys) => {
    return [
        {
            isLoading: false,
            isError: false,
            data: { value: 'Success1' },
        },
        {
            isLoading: false,
            isError: false,
            data: { value: 'Success2' },
        },
        {
            isLoading: false,
            isError: false,
            data: { value: 'Success3' },
        },
    ];
});

describe('agsQueries', () => {
    beforeEach(() => {
        mockInvokeAgsApi.mockClear();
    });

    test('useAgsQuery for single item', async () => {
        mockInvokeAgsApi.mockResolvedValueOnce({ value: 'Succeed' });

        await expect(useAgsQuery<TestData>('TestQuery', 'key1', 'key2')).resolves.toEqual(
            {
                value: 'Succeed',
            }
        );

        expect(mockInvokeAgsApi).toBeCalledWith({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            pathTemplate: 'testkeys/{id}',
            serviceName: 'TestService',
        });
    });

    test('useAgsQuery multiple pages', async () => {
        mockInvokeAgsApi
            .mockResolvedValueOnce({
                results: [{ value: 'Succeed1' }],
                nextToken: 'next-token',
            })
            .mockResolvedValueOnce({
                results: [{ value: 'Succeed2' }],
                nextToken: 'next-token-1',
            })
            .mockResolvedValueOnce({
                results: [{ value: 'Succeed3' }],
            });

        await expect(
            useAgsQuery<TestData>('TestQueryGetAll', 'key1', 'key2')
        ).resolves.toEqual([
            { value: 'Succeed1' },
            { value: 'Succeed2' },
            { value: 'Succeed3' },
        ]);

        expect(mockInvokeAgsApi).toBeCalledTimes(3);
        expect(mockInvokeAgsApi.mock.calls[0][0]).toStrictEqual({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            // queryParams: {
            //     nextToken: 'next-token',
            // },
            pathTemplate: 'testkeys/{id}',
            serviceName: 'TestService',
        });
        expect(mockInvokeAgsApi.mock.calls[1][0]).toStrictEqual({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            pathTemplate: 'testkeys/{id}',
            queryParams: {
                nextToken: 'next-token',
            },
            serviceName: 'TestService',
        });
        expect(mockInvokeAgsApi.mock.calls[2][0]).toStrictEqual({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            pathTemplate: 'testkeys/{id}',
            queryParams: {
                nextToken: 'next-token-1',
            },
            serviceName: 'TestService',
        });
    });

    test('useAgsQuery negative', async () => {
        mockInvokeAgsApi.mockRejectedValueOnce(new Error('Error occurred'));

        await expect(useAgsQuery<TestData>('TestQuery', 'key1', 'key2')).rejects.toEqual(
            new Error('Error occurred')
        );

        expect(mockInvokeAgsApi).toBeCalledWith({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            pathTemplate: 'testkeys/{id}',
            serviceName: 'TestService',
        });
    });

    test('useAgsQuery negative ExpiredToken', async () => {
        mockInvokeAgsApi.mockRejectedValueOnce({
            response: {
                status: 403,
                data: {
                    message: 'The security token included in the request is expired',
                },
            },
        });

        await expect(useAgsQuery<TestData>('TestQuery', 'key1', 'key2')).rejects.toEqual(
            new ExpiredTokenException('Security Token expired')
        );

        expect(mockInvokeAgsApi).toBeCalledWith({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            pathTemplate: 'testkeys/{id}',
            serviceName: 'TestService',
        });
    });

    test('useAgsListQuery', async () => {
        mockInvokeAgsApi
            .mockResolvedValueOnce({
                results: [{ value: 'Succeed1' }],
                nextToken: 'next-token',
            })
            .mockResolvedValueOnce({
                results: [{ value: 'Succeed2' }],
                nextToken: 'next-token-1',
            })
            .mockResolvedValueOnce({
                results: [{ value: 'Succeed3' }],
            });

        await expect(
            useAgsListQuery<TestData>('TestQueryGetAll', 'key1', 'key2')
        ).resolves.toEqual([
            { value: 'Succeed1' },
            { value: 'Succeed2' },
            { value: 'Succeed3' },
        ]);

        expect(mockInvokeAgsApi).toBeCalledTimes(3);
        expect(mockInvokeAgsApi.mock.calls[0][0]).toStrictEqual({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            // queryParams: {
            //     nextToken: 'next-token',
            // },
            pathTemplate: 'testkeys/{id}',
            serviceName: 'TestService',
        });
        expect(mockInvokeAgsApi.mock.calls[1][0]).toStrictEqual({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            pathTemplate: 'testkeys/{id}',
            queryParams: {
                nextToken: 'next-token',
            },
            serviceName: 'TestService',
        });
        expect(mockInvokeAgsApi.mock.calls[2][0]).toStrictEqual({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            pathTemplate: 'testkeys/{id}',
            queryParams: {
                nextToken: 'next-token-1',
            },
            serviceName: 'TestService',
        });
    });

    test('useAgsInfiniteQuery', async () => {
        mockInvokeAgsApi.mockResolvedValueOnce({ value: 'Succeed' });

        await expect(
            useAgsInfiniteQuery<AgsPaginatedQueryResult<TestData>, {}>(
                'TestQuery',
                'key1',
                'key2'
            )
        ).resolves.toEqual({
            value: 'Succeed',
        });

        expect(mockInvokeAgsApi).toBeCalledWith({
            credential: {
                accessKeyId: 'abc',
                region: 'ap-southeast-1',
                secretAccessKey: 'def',
                sessionToken: 'uvwxyz',
            },
            endpoints: {
                TestService: 'https://TestService',
            },
            method: 'GET',
            pathParameters: {
                id: 'key1',
            },
            pathTemplate: 'testkeys/{id}',
            serviceName: 'TestService',
        });
    });

    test('useAgsBatchQuery', async () => {
        expect(useAgsBatchQuery<TestData>('TestQuery', ['key1', 'key2'])).toEqual({
            data: [{ value: 'Success1' }, { value: 'Success2' }, { value: 'Success3' }],
            errors: [],
            isError: false,
            isLoading: false,
        });

        expect(mockUseQueries).toBeCalledWith([
            { enabled: true, queryKey: ['TestQuery', 'key1'] },
            { enabled: true, queryKey: ['TestQuery', 'key2'] },
        ]);
    });
});

describe('getQueryClientParameters', () => {
    test('onError', async () => {
        const queryClientParams = getQueryClientParameters(
            queryMap,
            userCredentials,
            serviceEndpoints
        );

        expect(queryClientParams.defaultOptions).not.toBeNull();
        const options = queryClientParams.defaultOptions!;
        expect(options.queries?.onError!(new Error('Error Occours'))).toBeUndefined();
    });

    test('retry', async () => {
        const mockSetReauthentication = jest.fn();
        const queryClientParams = getQueryClientParameters(
            queryMap,
            userCredentials,
            serviceEndpoints,
            mockSetReauthentication
        );

        expect(queryClientParams.defaultOptions).not.toBeNull();
        const options = queryClientParams.defaultOptions!;
        const retryFunc = options.queries!.retry as (
            failureCount: number,
            error: Error
        ) => boolean;
        expect(retryFunc(1, new Error('Error Occurred'))).toBe(true);
        expect(retryFunc(2, new Error('Error Occurred'))).toBe(false);
        expect(mockSetReauthentication).toBeCalledTimes(0);
        expect(retryFunc(1, new ExpiredTokenException('Security Token expired'))).toBe(
            false
        );
        expect(mockSetReauthentication).toBeCalledTimes(1);
    });

    test('default query function', async () => {
        const queryClientParams = getQueryClientParameters(
            queryMap,
            userCredentials,
            serviceEndpoints
        );

        expect(queryClientParams.defaultOptions).not.toBeNull();
        const options = queryClientParams.defaultOptions!;
        const queryFn = options.queries!.queryFn!;

        mockInvokeAgsApi.mockResolvedValueOnce({ value: 'Succeed' });

        await expect(
            queryFn({
                queryKey: ['TestQuery', 'key1', 'key2'],
            } as unknown as QueryFunctionContext)
        ).resolves.toEqual({
            value: 'Succeed',
        });

        await expect(
            queryFn({
                queryKey: ['TestQueryNotExist', 'key1', 'key2'],
            } as unknown as QueryFunctionContext)
        ).rejects.toEqual(new Error('Unable to find query TestQueryNotExist'));
    });
});
