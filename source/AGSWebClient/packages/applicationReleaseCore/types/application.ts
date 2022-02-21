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

export interface Application {
    name: string;
    description?: string;
    applicationOwner: string;
    estateId: string;
    environmentIds: string[];
    attributes: Record<string, string>;
    metadata?: Record<string, string>;
    pipelineProvisionStatus: string;
    pipelineProvisionError: string;
    pipelineData: Record<string, string>;
    createTime: string;
    lastUpdateTime: string;
}

export interface environment {
    awsAccountId: string;
    estateId: string;
    name: string;
    isManualApprovalRequired: false;
    id: string;
    envClasses: string[];
    mandatory: boolean;
}

export interface Estate {
    id: string;
    name: string;
    environments: environment[];
}

export interface ApplicationSummary {
    name: string;
    description: string;
    applicationOwner: string;
    estateId: string;
    pipelineProvisionStatus: string;
    createTime: string;
    lastUpdateTime: string;
}

export interface CreateApplicationParams {
    name: string;
    description?: string;
    applicationOwner: string;
    attributes: { [key: string]: string };
    metadata?: { [key: string]: string };
    estateId: string;
    environmentIds: string[];
}

export interface CreateApplicationResponse extends Application {}

export interface UpdateApplicationParams extends CreateApplicationParams {
    id?: string;
}

export interface UpdateApplicationResponse extends Application {}

export interface DeleteApplicationParams {
    name: string;
    forceDelete?: boolean;
}

export interface DeleteApplicationResponse {
    name: string;
}
