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

export interface Estate {
    /** The unique identifier (ID) of an estate. */
    id: string;
    /** Name of the estate */
    name: string;
    /** the Id of the parent business unit */
    parentBUId: string;
    /** the AWS account number for tooling account */
    toolingAccountId: string;
    /** environments that belong to this estate */
    environments?: Array<Environment>;
    /** Date in UTC when this entity was created */
    creationTime?: string;
    /** Date in UTC when this entity was last updated */
    lastUpdatedTime?: string;
}

export interface EstateDisplay extends Estate {
    parentBUName?: string;
}

export interface EnvironmentClass {
    name: string;
    description: string;
    creationTime: string;
}

export interface Environment {
    id: string;
    name: string;
    estateId: string;
    envClasses: string[];
    mandatory: boolean;
    awsAccountId: string;
    creationTime: string;
    lastUpdatedTime: string;
    isManualApprovalRequired: boolean;
}

export interface CreateEstateEnvironmentParams {
    name: string;
    envClasses: string[];
    awsAccountId: string;
}

export interface CreateEstateParams {
    name: string;
    parentBUId: string;
    toolingAccountId: string;
    environments: CreateEstateEnvironmentParams[];
}

export interface CreateEstateEnvironmentResponse {
    id: string;
    name: string;
    estateId: string;
    mandatory: boolean;
    envClasses: string[];
    awsAccountId: string;
    creationTime: string;
    lastUpdatedTime: string;
    isManualApprovalRequired: boolean;
}

export interface CreateEstateResponse {
    id: string;
    name: string;
    parentBUId: string;
    status: string;
    toolingAccountId: string;
    createTime: string;
    lastUpdatedTime: string;
    environments: CreateEstateEnvironmentResponse[];
    additionalInstructions: AdditionalInstruction[];
}

export interface CreateEnvClassParams {
    name: string;
    description: string;
}

export interface AdditionalInstruction {
    key: string;
    value: string[];
}

export interface CreateEnvClassResponse {
    name: string;
    description: string;
}
