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
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';
import { clearSecurityToken } from '../utils/auth';
import { useGovSuiteAppApi } from '../containers/AppContext';
import { MutationBase, MutationConstructor } from './mutationBase';

const mutationFn = async <
    TParams,
    TData,
    TError,
    TMutation extends MutationBase<TParams, TData, TError>
>(
    request: TParams,
    mutation: TMutation
): Promise<TData> => {
    console.info(`Mutate call on ${mutation.constructor.name}.`);
    console.debug('Mutation request: ' + JSON.stringify(request));
    return mutation.mutate(request);
};

export function useAgsMutation<TData, TParams, TError = Error>(
    mutationType: string,
    options?: UseMutationOptions<TData, TError, TParams>
) {
    const { userCredential, apiEndpoints, mutationMap, setHasLoggedIn } =
        useGovSuiteAppApi();

    const queryClient = useQueryClient();

    // handler to clear local credentials and reauthenticte
    const setReauthenticate = () => {
        clearSecurityToken();
        setHasLoggedIn(false);
    };

    const mutationConstructor = mutationMap[
        mutationType.toString()
    ] as MutationConstructor<TParams, TData, TError>;

    if (!mutationConstructor) {
        throw new Error(`Unable to find mutation ${mutationType.toString()}`);
    }

    const mutation = new mutationConstructor(
        userCredential!,
        apiEndpoints!,
        queryClient!,
        setReauthenticate
    );

    return useMutation<TData, TError, TParams>(
        (request) =>
            mutationFn<TParams, TData, TError, typeof mutation>(request, mutation),
        {
            onMutate: async (variables: TParams) => {
                await mutation.onMutate(variables);
                if (options?.onMutate) {
                    await options.onMutate(variables);
                }
            },
            onSuccess: async (data: TData, variables: TParams, context) => {
                await mutation.onSuccess(data, variables, context);
                if (options?.onSuccess) {
                    await options.onSuccess(data, variables, context);
                }
            },
            onError: async (error: TError, variables: TParams, context) => {
                await mutation.onError(error, variables, context);
                if (options?.onError) {
                    await options.onError(error, variables, context);
                }
            },
            onSettled: async (
                data: TData | undefined,
                error: TError | null,
                variables: TParams,
                context?
            ) => {
                await mutation.onSettled(data, error, variables, context);
                if (options?.onSettled) {
                    await options.onSettled(data, error, variables, context);
                }
            },
        }
    );
}
