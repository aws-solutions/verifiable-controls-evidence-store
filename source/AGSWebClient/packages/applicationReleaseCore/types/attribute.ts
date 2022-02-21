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

export interface Attribute {
    name: string;
    key: string;
    value: string;
    description: string;
    metadata: Record<string, string>;
    createTime: string;
    lastUpdateTime: string;
}

export interface AttributeSummary {
    name: string;
    key: string;
    value: string;
    createTime: string;
    lastUpdateTime: string;
    isMandatory: boolean;
}

export interface CreateAttributeParams
    extends Omit<Attribute, 'name' | 'createTime' | 'lastUpdateTime'> {}

export interface CreateAttributeResponse extends Attribute {}

export interface UpdateAttributeParams extends CreateAttributeParams {
    name: string;
}

export interface UpdateAttributeResponse extends Attribute {}

export interface DeleteAttributeParams {
    name: string;
}

export interface DeleteAttributeResponse {
    name: string;
}
