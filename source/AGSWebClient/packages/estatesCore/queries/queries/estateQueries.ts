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
    AgsPaginatedQueryResult,
    QueryBase,
    AgsApiOptions,
} from '@ags/webclient-core/queries';
import { Estate } from '../../types';

export class ListEstates extends QueryBase<AgsPaginatedQueryResult<Estate>> {
    createRequest(queryKey: any[], pageParam?: string): AgsApiOptions {
        const limit: number = queryKey[1] ? queryKey[1] : 10;
        const queryParams: Record<string, unknown> = { limit };

        if (pageParam) {
            queryParams.nextToken = pageParam;
        }

        return {
            serviceName: 'AGSEstateManagementService',
            pathTemplate: 'estates',
            method: 'GET',
            queryParams,
        };
    }
}

export class ListAllEstates extends QueryBase<Estate> {
    // fetch all pages at once
    shouldFetchAllPages(): boolean {
        return true;
    }
    createRequest(queryKey: string[]): AgsApiOptions {
        return {
            serviceName: 'AGSEstateManagementService',
            pathTemplate: 'estates',
            method: 'GET',
        };
    }
}

export class GetEstate extends QueryBase<Estate> {
    createRequest(queryKey: any[]): AgsApiOptions {
        return {
            serviceName: 'AGSEstateManagementService',
            pathTemplate: 'estates/{id}',
            method: 'GET',
            pathParameters: { id: queryKey[1] },
        };
    }
}

export class GetEstateByEnv extends QueryBase<Estate> {
    createRequest(queryKey: any[]): AgsApiOptions {
        return {
            serviceName: 'AGSEstateManagementService',
            pathTemplate: 'estates',
            method: 'GET',
            queryParams: { envId: queryKey[1] },
        };
    }
}

export class ListEnvClasses extends QueryBase<Estate> {
    // fetch all pages at once
    shouldFetchAllPages(): boolean {
        return true;
    }

    createRequest(queryKey: any[]): AgsApiOptions {
        return {
            serviceName: 'AGSEstateManagementService',
            pathTemplate: 'envclasses',
            method: 'GET',
            queryParams: {
                maxRow: 500,
            },
        };
    }
}
