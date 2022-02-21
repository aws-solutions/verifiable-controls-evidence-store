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
    QueryBase,
    AgsApiOptions,
    AgsPaginatedQueryResult,
} from '@ags/webclient-core/queries';
import { Evidence } from '../../types';

export class SearchEvidence extends QueryBase<AgsPaginatedQueryResult<Evidence>> {
    createRequest(queryKey: any[], pageParam?: string): AgsApiOptions<{}> {
        let payload: Record<string, string | number | boolean> = {};

        if (queryKey[1]) {
            payload = { ...queryKey[1] };
        }

        if (pageParam) {
            payload.nextToken = pageParam;
        }

        payload.limit = 20;

        return {
            serviceName: 'AGSEvidenceStore',
            pathTemplate: 'evidences/search',
            method: 'POST',
            payload,
        };
    }
}
