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
export interface ReleaseCandidate {
    releaseCandidateId: string;
    externalPipelineId: string;
    externalPipelineExecutionId: string;
    applicationId: string;
    commitId: string;
    sourceLocation: string;
    releaseArtifactUri: string;
    graphBuild: boolean;
    deployments: Deployment[];
    artifacts: Artifact[];
    creationTime: string;
}

export interface Deployment {
    deploymentId: string;
    environmentId: string;
    state: string;
}

export interface Artifact {
    artifactName: string;
    artifactVersion: string;
    dependencies: Dependency[];
}

export interface Dependency {
    name: string;
    version: string;
}

export interface ReleaseCandidateSummary {
    id: string;
    name: string;
    description: string;
    category: string;
}
