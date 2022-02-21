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
import { QueryClient } from 'react-query';
import { ApiEndpoints, UserCredential } from '../types';
import { invokeAgsApi, AgsApiOptions } from './agsApi';
import { Base } from './base';
import { ExpiredTokenException } from './types';

export interface MutationMap {
    [mutationType: string]: any;
}

export interface MutationConstructor<TParams, TData, TError> {
    new (
        userCredential: UserCredential,
        apiEndpoints: ApiEndpoints,
        queryClient: QueryClient,
        setReauthenticate: () => void
    ): MutationBase<TParams, TData, TError>;
}

export abstract class MutationBase<
    TParams,
    TData,
    TError = Error,
    TContext = unknown
> extends Base {
    constructor(
        public userCredential: UserCredential,
        public apiEndpoints: ApiEndpoints,
        public queryClient: QueryClient,
        public setReauthenticate: () => void
    ) {
        super();
    }
    async mutate(request: TParams): Promise<TData> {
        const options = this.createRequest(request);
        options.credential = this.userCredential;
        options.endpoints = this.apiEndpoints;

        try {
            return await invokeAgsApi<TParams, TData>(options);
        } catch (e) {
            // transform errors and rethrow in the proper format
            throw this.transformError(e);
        }
    }

    // call the mutation callback after complete the handling in base
    onSuccess(
        data: TData,
        _variables: TParams,
        _context: TContext
    ): Promise<unknown> | void {
        console.debug('MutationBase onSuccess called');
        return this.onComplete(null, data);
    }
    onError(
        error: TError,
        _variables: TParams,
        _context: TContext
    ): Promise<unknown> | void {
        console.debug('MutationBase onError called');
        // Error handling here to detect the error that caused by expire credentials
        // if it is expire token,set to reauthenticate
        if (
            (error as unknown as ExpiredTokenException).name ===
                'ExpiredTokenException' &&
            (error as unknown as ExpiredTokenException).message ===
                'Security Token expired'
        ) {
            console.log('Security Token expired in mutation.');
            this.setReauthenticate();
            return;
        }

        return this.onComplete(error, null);
    }

    // only handled in base.
    onMutate(_variables: TParams): Promise<unknown> | void {
        console.debug('MutationBase onMutate called');
    }
    onSettled(
        _data: TData | undefined,
        _error: TError | null,
        _variables: TParams,
        _context?: TContext
    ): Promise<unknown> | void {
        console.debug('MutationBase onSettled called');
    }

    // Functions must be implemented by each Mutation

    /**
     * Create request object that can be sent to the backend
     *
     * @param request
     */
    abstract createRequest(request: TParams): AgsApiOptions<TParams>;

    /**
     * Callback function when request to the back is completed.
     * @param error Error returned when the request fails
     * @param data Data returned from the backend when request is succeeded
     */
    async onComplete(_error: TError | null, _data: TData | null): Promise<void> {}
}
