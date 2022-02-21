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
import { useMutation } from 'react-query';
import { useAgsMutation, MutationBase, AgsApiOptions } from '@ags/webclient-core/queries';
import '@ags/webclient-core/containers/AppContext';
import { invokeAgsApi } from './agsApi';
import '../utils/auth';

jest.mock('react-query');
jest.mock('./agsApi', () => {
    return {
        invokeAgsApi: jest.fn(),
    };
});

jest.mock('../utils/auth', () => {
    return {
        clearSecurityToken: jest.fn(),
    };
});

const mockInvokeAgsApi = invokeAgsApi as jest.Mock<any>;
const mockUseMutation = useMutation as jest.Mock<any>;

type TestParam = {
    value: string;
};

type TestData = {
    id: string;
    value: string;
};

class TestMutation extends MutationBase<TestParam, TestData> {
    createRequest(request: TestParam): AgsApiOptions<TestData> {
        return {
            serviceName: 'TestService',
            pathTemplate: 'testendpoint',
            method: 'POST',
            payload: {
                value: request.value,
            },
        };
    }

    async onComplete(error: Error | null, data: TestData | null): Promise<void> {
        if (error) {
            console.debug('Test Mutation onError ' + error);
        } else if (data) {
            console.debug('Test Mutation onSuccess ' + JSON.stringify(data));
        }
    }
}

jest.mock('@ags/webclient-core/containers/AppContext', () => ({
    useGovSuiteAppApi: () => ({
        userCredential: {
            region: 'ap-southeast-1',
            accessKeyId: 'abc',
            secretAccessKey: 'def',
            sessionToken: 'uvwxyz',
        },
        apiEndpoints: {
            TestService: 'https://TestService',
        },
        mutationMap: {
            TestMutation: TestMutation,
        },
        setHasLoggedIn: jest.fn(),
    }),
}));

mockUseMutation.mockImplementation((mutationFn, options) => {
    return {
        mutate: async (request: any) => {
            options.onMutate(request);
            try {
                const data = await mutationFn.apply(null, [request]);
                options.onSuccess(data, request);
                options.onSettled(data, null, request);
                return data;
            } catch (e) {
                options.onError(e, request);
                throw e;
            }
        },
    };
});

describe('agsMutations', () => {
    beforeEach(() => {
        mockInvokeAgsApi.mockClear();
    });

    test('useAgsMutation success', async () => {
        mockInvokeAgsApi.mockResolvedValueOnce({ value: 'Succeed' });

        const mutation = useAgsMutation<TestParam, TestData>('TestMutation', {
            onSuccess: jest.fn(),
            onMutate: jest.fn(),
            onError: jest.fn(),
            onSettled: jest.fn(),
        });
        await expect(
            mutation.mutate({ id: 'key1', value: 'Test Value' })
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
            method: 'POST',
            pathTemplate: 'testendpoint',
            payload: {
                value: 'Test Value',
            },
            serviceName: 'TestService',
        });
    });

    test('useAgsMutation failed', async () => {
        mockInvokeAgsApi.mockRejectedValueOnce(new Error('Error Occurred'));

        const mutation = useAgsMutation<TestParam, TestData>('TestMutation');
        await expect(
            mutation.mutate({ id: 'key1', value: 'Test Value' })
        ).rejects.toEqual(new Error('Error Occurred'));

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
            method: 'POST',
            pathTemplate: 'testendpoint',
            payload: {
                value: 'Test Value',
            },
            serviceName: 'TestService',
        });
    });

    test('useAgsMutation failed with expired token', async () => {
        mockInvokeAgsApi.mockRejectedValueOnce({
            response: {
                status: 403,
                data: {
                    message: 'The security token included in the request is expired',
                },
            },
        });

        const mutation = useAgsMutation<TestParam, TestData>('TestMutation', {
            onSuccess: jest.fn(),
            onMutate: jest.fn(),
            onError: jest.fn(),
            onSettled: jest.fn(),
        });
        await expect(
            mutation.mutate({ id: 'key1', value: 'Test Value' })
        ).rejects.toEqual(new Error('Security Token expired'));

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
            method: 'POST',
            pathTemplate: 'testendpoint',
            payload: {
                value: 'Test Value',
            },
            serviceName: 'TestService',
        });
    });

    test('useAgsMutation invalid mutation', () => {
        expect(() =>
            useAgsMutation<TestParam, TestData>('TestMutationNonExist')
        ).toThrowError('Unable to find mutation TestMutationNonExist');
    });
});
