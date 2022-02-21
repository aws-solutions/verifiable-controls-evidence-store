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

import * as cdk from 'aws-cdk-lib';
import { AGSSharedInfraStageProps } from './ags-types';
import { AGSBaseInfraStack } from './ags-baseinfra-stack';
import { AGSWebClientStack } from './ags-web-client-stack';
import { Construct } from 'constructs';
import { CfnNagCustomResourceSuppressionAspect } from './cfn-nag-suppression';
import { Aspects } from 'aws-cdk-lib';

export class AGSSharedInfraStage extends cdk.Stage {
    constructor(scope: Construct, id: string, props: AGSSharedInfraStageProps) {
        super(scope, id, props);

        // target environment name
        const envName = props.envName;

        // current environment
        const account = props.env?.account;
        const region = props.env?.region;

        // application name
        const serviceName = props.serviceName;
        const sharedInfraVersion = props.sharedInfraVersion;

        // configuration
        const configName: string = props.configName;
        const configuration = props.configuration;

        console.log(
            `CDK synth ${serviceName} on stage [${id}] with configuration ${configName} to target environment ${envName} [${account}/${region}].`
        );

        // Common Tags
        const tags = {
            'ags:application': 'AWS Governance Suite',
            'ags:service': 'AGSSharedInfra',
            'ags:config': configName,
            'ags:env': envName,
        };

        // Common Props
        const commonProps = {
            env: props.env,
            serviceName,
            envName,
            configName,
            configuration,
            sharedInfraVersion,
            tags,
        };

        // Base Infra
        const baseInfraStackName = `${serviceName}-BaseInfra`;
        const baseInfraStack = new AGSBaseInfraStack(this, baseInfraStackName, {
            ...commonProps,
            stackName: baseInfraStackName,
            description: this.getStackDescription(
                'baseinfra',
                `Base Infrastructure stack of ${serviceName}`,
                props.solutionInfo
            ),
        });

        // Web Client
        const webClientStackName = `${serviceName}-WebClient`;
        const webClientStack = new AGSWebClientStack(this, webClientStackName, {
            ...commonProps,
            stackName: webClientStackName,
            description: this.getStackDescription(
                'webclient',
                `Web client stack of ${serviceName}`,
                props.solutionInfo
            ),
        });
        webClientStack.addDependency(baseInfraStack);
        Aspects.of(webClientStack).add(new CfnNagCustomResourceSuppressionAspect());
    }

    private getStackDescription(
        shortDescription: string,
        baseDescription: string,
        solutionInfo?: Record<string, string>
    ): string {
        const solutionId = solutionInfo?.solutionId;
        const solutionVersion = solutionInfo?.solutionVersion;
        return solutionId && solutionVersion
            ? `(${solutionId}-${shortDescription}) - ${baseDescription}. Version ${solutionVersion}`
            : baseDescription;
    }
}
