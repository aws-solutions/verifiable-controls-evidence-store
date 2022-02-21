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
    ListEvidenceProviders,
    GetEvidenceProvider,
    GetSchemaDetails,
} from './queries/listEvidenceProviders';
import { SearchEvidence } from './queries/searchEvidence';
import { GetEvidence } from './queries/getEvidence';
import {
    GetEvidenceVerificationStatus,
    GetRevisionVerificationStatus,
} from './queries/getEvidenceVerificationStatus';
import { QueryType } from './types';
import { GetRevision, ListRevisions } from './queries/evidenceRevision';

const queryMap = {
    [QueryType.LIST_EVIDENCE_PROVIDERS]: ListEvidenceProviders,
    [QueryType.GET_EVIDENCE_PROVIDER]: GetEvidenceProvider,
    [QueryType.GET_SCHEMA_DETAILS]: GetSchemaDetails,
    [QueryType.GET_EVIDENCE]: GetEvidence,
    [QueryType.SEARCH_EVIDENCE]: SearchEvidence,
    [QueryType.GET_EVIDENCE_VERIFICATION_STATUS]: GetEvidenceVerificationStatus,
    [QueryType.LIST_REVISIONS]: ListRevisions,
    [QueryType.GET_REVISION]: GetRevision,
    [QueryType.GET_REVISION_VERIFICATION_STATUS]: GetRevisionVerificationStatus,
};

export default queryMap;
