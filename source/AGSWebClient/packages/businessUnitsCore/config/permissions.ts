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
import { UserGroup } from '@ags/webclient-core/types';

export const PERMISSION_ENTERPRISE_MANAGE = [UserGroup.ServiceManager];
export const PERMISSION_ENTERPRISE_VIEW = [
    ...PERMISSION_ENTERPRISE_MANAGE,
    UserGroup.DomainOwner,
];

// user groups that can list, view and update business units
export const PERMISSION_BUSINESS_UNIT_MANAGE = [
    UserGroup.ServiceManager,
    UserGroup.ChiefRiskOffice,
    UserGroup.DomainOwner,
];

// user groups that can list and view business units
export const PERMISSION_BUSINESS_UNIT_VIEW = [...PERMISSION_BUSINESS_UNIT_MANAGE];
