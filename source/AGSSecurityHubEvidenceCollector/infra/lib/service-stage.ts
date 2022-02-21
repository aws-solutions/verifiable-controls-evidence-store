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
import { Construct } from 'constructs';
import { AGSServiceStage, AGSServiceStageProps } from '@ags-cdk/ags-service-template';
import { SecurityHubEvidenceCollectorStack } from './securityhub-evidence-collector-stack';

/**
 * The Service Stage class defines a `Service Stage` that can be deployed into a specific target environment
 *
 * An instance of this class is synthed into a subdirectory in cdk.out and contains the
 * cloud assembly for the partitular target environment.
 */
export class ServiceStage extends AGSServiceStage {
    constructor(scope: Construct, id: string, props: AGSServiceStageProps) {
        super(scope, id, props);

        const description =
            this.solutionInfo?.solutionId && this.solutionInfo?.solutionVersion
                ? `(${this.solutionInfo.solutionId}-evidencecollector) - AGS Service stack for ${this.serviceName}. Version ${this.solutionInfo.solutionVersion}`
                : undefined;

        super.addStack(SecurityHubEvidenceCollectorStack, '', {
            description,
        });
    }
}
