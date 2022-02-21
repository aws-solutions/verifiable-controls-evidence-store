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

export const PERMISSION_ESTATE_MANAGE = [
    UserGroup.ServiceManager,
    UserGroup.ApplicationOwner,
];

export const PERMISSION_ESTATE_VIEW = [
    ...PERMISSION_ESTATE_MANAGE,
    UserGroup.DomainOwner,
];

export const PERMISSION_ENVCLASS_MANAGE = [UserGroup.ServiceManager];

export const PERMISSION_ENVCLASS_VIEW = [
    ...PERMISSION_ESTATE_MANAGE,
    UserGroup.DomainOwner,
    UserGroup.ApplicationOwner,
    UserGroup.ApplicationDeveloper,
];
