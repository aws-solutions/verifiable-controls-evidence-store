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
import { AGSRole, AGSApiExternalUserPermission } from '@ags-cdk/ags-service-template';

export const userPermission: AGSApiExternalUserPermission[] = [
    {
        endpoints: [{ resourcePath: 'evidences', httpMethod: 'POST' }],
        allowedAGSRoles: [
            AGSRole.CONTROL_OWNER,
            AGSRole.APPLICATION_OWNER,
            AGSRole.SERVICE_MANAGER,
            AGSRole.DOMAIN_OWNER,
        ],
    },
    {
        endpoints: [
            { resourcePath: 'evidences/*/verificationstatus', httpMethod: 'GET' },
        ],
        allowedAGSRoles: [
            AGSRole.LINE_THREE_RISK,
            AGSRole.LINE_TWO_RISK,
            AGSRole.LINE_ONE_RISK,
            AGSRole.CONTROL_OWNER,
        ],
    },
    {
        endpoints: [
            { resourcePath: 'evidences', httpMethod: 'GET' },
            { resourcePath: 'evidences/search', httpMethod: 'POST' },
            { resourcePath: 'evidences/*/revisions', httpMethod: 'GET' },
            { resourcePath: 'evidences/*', httpMethod: 'GET' },
        ],
        allowedAGSRoles: [AGSRole.EVERYONE],
    },
    {
        endpoints: [{ resourcePath: 'providers', httpMethod: 'POST' }],
        allowedAGSRoles: [AGSRole.CONTROL_OWNER, AGSRole.SERVICE_MANAGER],
    },
    {
        endpoints: [{ resourcePath: 'providers', httpMethod: 'GET' }],
        allowedAGSRoles: [
            AGSRole.CHIEF_RISK_OFFICE,
            AGSRole.SERVICE_MANAGER,
            AGSRole.LINE_ONE_RISK,
            AGSRole.LINE_TWO_RISK,
        ],
    },
    {
        endpoints: [{ resourcePath: 'providers/*', httpMethod: 'GET' }],
        allowedAGSRoles: [
            AGSRole.CHIEF_RISK_OFFICE,
            AGSRole.SERVICE_MANAGER,
            AGSRole.LINE_ONE_RISK,
            AGSRole.LINE_TWO_RISK,
        ],
    },
    {
        endpoints: [
            { resourcePath: 'providers/*/schemas', httpMethod: 'POST' },
            { resourcePath: 'providers/*/schemas/*', httpMethod: 'GET' },
        ],
        allowedAGSRoles: [AGSRole.CONTROL_OWNER],
    },
    {
        endpoints: [{ resourcePath: 'providers/*', httpMethod: 'PUT' }],
        allowedAGSRoles: [AGSRole.CHIEF_RISK_OFFICE, AGSRole.SERVICE_MANAGER],
    },
];
