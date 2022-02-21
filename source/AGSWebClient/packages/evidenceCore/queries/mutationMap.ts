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

import { CreateEvidenceMutation } from './mutations/createEvidence';
import { CreateEvidenceProviderMutation } from './mutations/createEvidenceProvider';
import { CreateSchemaMutation } from './mutations/createSchema';
import { GenerateAttachmentLink } from './mutations/generateAttachmentLink';
import { MutationType } from './types';

const mutationMap = {
    [MutationType.CREATE_EVIDENCE]: CreateEvidenceMutation,
    [MutationType.CREATE_EVIDENCEPROVIDER]: CreateEvidenceProviderMutation,
    [MutationType.GENERATE_ATTACHMENT_LINK]: GenerateAttachmentLink,
    [MutationType.CREATE_SCHEMA]: CreateSchemaMutation,
};

export default mutationMap;
