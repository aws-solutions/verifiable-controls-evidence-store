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
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Configuration } from './ags-types';
import { AGSServiceProps } from './ags-service';
import { PermissionsBoundary } from './ags-aspects';
import { Construct } from 'constructs';
export interface AGSServiceStageProps extends cdk.StageProps {
    /**
     * Name of the service.
     *
     * Required to be specified in cdk.json
     */
    serviceName: string;
    /**
     * configuration name
     *
     * Name of the current configuration
     *
     */
    configName: string;
    /**
     * Configuration data
     *
     * Configuration data retrieved from the configuration file in the configuration directory.
     */
    configuration?: Configuration;
    /**
     * Name of the target environment to be deployed to
     *
     */
    envName: string;
    /**
     * Solution information such as solution id (from valence) and version
     */
    solutionInfo?: Record<string, string>;
}

// generic type for Service constructor function
interface ServiceStackProps<T>
    extends Omit<cdk.StackProps, 'stackName' | 'description' | 'tags'> {
    serviceProps: T & AGSServiceProps;
}

type Constructor<T, U> = new (
    scope: Construct,
    id: string,
    props: ServiceStackProps<U>
) => T;

/**
 * The Service Stage base class that defined a `Service Stage` that can be deployed into
 * a specific target environment.
 *
 * An instance of this class is synthed into a sub-directly in cdk.out and contains the
 * cloud assembly for a partitular target environment.
 */
export class AGSServiceStage extends cdk.Stage {
    public readonly serviceName: string;
    public readonly configuration: Configuration;
    public readonly configName: string;
    public readonly tags: Record<string, string>;
    public readonly solutionInfo?: Record<string, string>;

    constructor(scope: Construct, id: string, props: AGSServiceStageProps) {
        super(scope, id, props);

        this.serviceName = props.serviceName;
        this.configuration = props.configuration || {};
        this.configName = props.configName;

        console.log(
            `CDK synth ${this.serviceName} on stage [${id}] with configuration [${this.configName}] to target environment ${props.envName} [${this.account}/${this.region}].`
        );

        // common Tags
        this.tags = {
            'ags:application': 'AWS Governance Suite',
            'ags:service': this.serviceName,
            'ags:configName': this.configName,
            'ags:env': props.envName,
        };

        this.solutionInfo = props.solutionInfo;
    }

    /**
     * Instantiate and add a Service Stack to the stage.
     *
     * This function instantiate a new Service Stack class and add it to the stage.
     *
     * @param stackConstructor Service stack class name
     * @param name The name of the stack if there are multiple stacks. It can be omitted if only one stack
     * @param props The properties for this particular stack
     * @returns Service stack object
     */
    addStack<T extends cdk.Stack, U extends { description?: string }>(
        stackConstructor: Constructor<T, U>,
        name: string = '',
        props: U
    ): T {
        let stackName = this.serviceName;
        if (name && name.trim().length > 0) {
            stackName += `-${name.trim()}`;
        }

        const solutionId = this.solutionInfo?.solutionId;
        const solutionVersion = this.solutionInfo?.solutionVersion;

        const agsDescription = `AGS Service stack for ${this.serviceName}`;

        // if there is a provided description, use it, otherwise construct it from solutionId, solutionVersion and standard AGS service descritpion
        const description = props.description
            ? props.description
            : solutionId && solutionVersion
            ? `(${solutionId}) - ${agsDescription}. Version ${solutionVersion}`
            : agsDescription;

        const stackProps = {
            serviceProps: {
                ...props,
                serviceName: this.serviceName,
                configName: this.configName,
                configuration: this.configuration,
                solutionId,
                solutionVersion,
            },
            stackName: stackName,
            description,
            tags: this.tags,
        };

        const stack = new stackConstructor(this, stackName, stackProps);

        // look up permission boundary policy arn from shared infra
        const policyArn = ssm.StringParameter.valueFromLookup(
            stack,
            '/ags/permissionBoundaryPolicyArn'
        );

        if (/arn:aws:iam::[0-9]+:policy\/.+/.test(policyArn)) {
            cdk.Aspects.of(stack).add(new PermissionsBoundary(policyArn));
        }
        return stack;
    }
}
