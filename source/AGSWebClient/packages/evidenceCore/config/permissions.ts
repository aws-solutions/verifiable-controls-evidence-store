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

export const PERMISSION_EVIDENCE_VIEW = [
    UserGroup.Line1Risk,
    UserGroup.Line2Risk,
    UserGroup.Line3Risk,
    UserGroup.ControlOwner,
    UserGroup.EvidenceProvider,
    UserGroup.DomainOwner,
];

export const PERMISSION_EVIDENCE_PROVIDERS_VIEW = [
    UserGroup.Line1Risk,
    UserGroup.Line2Risk,
    UserGroup.Line3Risk,
    UserGroup.ControlOwner,
    UserGroup.EvidenceProvider,
    UserGroup.ServiceManager,
    UserGroup.DomainOwner,
];

export const PERMISSION_EVIDENCE_PROVIDER_MANAGE = [UserGroup.EvidenceProvider];

export const PERMISSION_EVIDENCE_MANAGE = [
    UserGroup.ControlOwner,
    UserGroup.ApplicationOwner,
    UserGroup.DomainOwner,
    UserGroup.ServiceManager,
];
