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
import { EvidenceData } from 'src/data/schemas/EvidenceData';

export interface ElasticSearchEvidenceData extends EvidenceData {
    content: Record<string, unknown>;
    contentString: string | null;
    revisionDetails: RevisionDetails;
}

export interface RevisionDetails {
    metadata: DocumentMetadata;
    blockAddress: BlockAddress;
    digest: LedgerDigest;
    hash: string;
}

export interface LedgerDigest {
    digest: string;
    digestTipAddress?: BlockAddress;
}

export interface BlockAddress {
    strandId: string;
    sequenceNo: number;
}

export interface DocumentMetadata {
    id: string;
    version: number;
    txTime: string;
    txId: string;
}
