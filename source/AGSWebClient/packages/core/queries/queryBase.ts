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
import { ApiEndpoints, UserCredential } from '../types';
import { AgsPaginatedQueryResult } from './types';
import { AgsApiOptions, invokeAgsApi } from './agsApi';
import { Base } from './base';

export interface QueryMap {
    [queryType: string]: any;
}

export abstract class QueryBase<TData, TParams = {}> extends Base {
    constructor(
        public userCredential: UserCredential,
        public apiEndpoints: ApiEndpoints
    ) {
        super();
    }

    /**
     * Should all pages to be fetched to frontend.
     *
     * @default false It can be overridden in query class
     */
    shouldFetchAllPages(): boolean {
        return false;
    }

    async query(queryKey: string[], pageParam?: string): Promise<TData | TData[]> {
        try {
            const options = this.createRequest(queryKey, pageParam);
            options.credential = this.userCredential;
            options.endpoints = this.apiEndpoints;

            if (!this.shouldFetchAllPages()) {
                // make one API call
                return await invokeAgsApi<TParams, TData>(options);
            } else {
                // make multiple API calls until all pages are fetched
                const results: TData[] = [];
                let nextToken = undefined;
                do {
                    const args = { ...options };
                    // if there is next page, get next page
                    if (nextToken) {
                        args.queryParams = { ...options.queryParams, nextToken };
                    }
                    const result = await invokeAgsApi<
                        TParams,
                        AgsPaginatedQueryResult<TData>
                    >(args);
                    // store the results
                    results.push(...result.results);
                    // get next token
                    nextToken = result.nextToken;
                } while (nextToken);

                return results;
            }
        } catch (e) {
            // transform errors and rethrow in the proper format
            throw this.transformError(e);
        }
    }

    /**
     * Create request object that can be sent to the backend
     *
     * @param request
     */
    abstract createRequest(queryKey: any[], pageParam?: string): AgsApiOptions<TParams>;
}
