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
import { QueryBase, AgsApiOptions } from '@ags/webclient-core/queries';
import { GovernedEntityAssociation } from '../../types';

export class GetGovernedEntityAssociation extends QueryBase<GovernedEntityAssociation> {
    createRequest(queryKey: string[]): AgsApiOptions {
        console.log('query invoked');
        return {
            serviceName: 'AGSRiskManagementService',
            pathTemplate: 'association/{entityType}/{entityId}',
            method: 'GET',
            pathParameters: { entityType: queryKey[1], entityId: queryKey[2] },
            queryParams: {
                suppressError: 1,
            },
        };
    }
}
