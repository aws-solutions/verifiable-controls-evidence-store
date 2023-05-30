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
import { Dashboard } from 'aws-cdk-lib/aws-cloudwatch';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
    Code,
    CodeSigningConfig,
    Function,
    FunctionProps,
    IFunction,
    LayerVersion,
    Runtime,
    Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { Platform, SigningProfile } from 'aws-cdk-lib/aws-signer';
import { Duration, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import {
    createDependencyLayer,
    DEFAULT_PYTHON_VERSION,
    getPythonCommonDependencyLayer,
} from './aws-python-lambda-dependency-layer';

const pythonRuntime = [
    Runtime.PYTHON_3_6,
    Runtime.PYTHON_3_7,
    Runtime.PYTHON_3_8,
    Runtime.PYTHON_3_9,
];
export type PythonRuntime = typeof pythonRuntime[number];

export type PythonFunctionProps = Omit<
    FunctionProps,
    'runtime' | 'code' | 'role' | 'vpc'
> & {
    /**
     * Source code relative path
     * @defaultValue `../lambda`
     */
    sourceCodePath?: string;
    /**
     * Function name, used to create an unique role for the function
     *
     */
    functionName: string;
    /**
     * Runtime version for python, only accept python 3.6 ~ 3.9
     * @defaultValue PYTHON_3_9
     */
    pythonRuntime?: PythonRuntime;
    /**
     * CloudWatch dashboard for this function's metrics to attach to
     * @defaultValue Undefined, no metrics added.
     */
    dashboard?: Dashboard;
    /**
     * Skip code signing
     * @defaultValue False
     */
    skipCodeSigning?: boolean;
    /**
     * Source code relative path
     * @defaultValue Undefined, default place lambda outside VPC
     */
    vpc?: IVpc;
};

/**
 * Python lambda construct
 * This construct creates/reuses common layer if no specific requirement spec set
 */
export class PythonLambda extends Construct {
    private readonly LAMBDA_RELATIVE_PATH = '../lambda';
    public readonly function: IFunction;
    constructor(scope: Construct, id: string, props: PythonFunctionProps) {
        super(scope, id);
        const functionRole = new Role(this, 'ExecutionRole', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            roleName: `${props.functionName}-${Stack.of(this).region}-Role`,
            description: `Lambda execution role for function`,
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole'
                ),
                // must to have this one for lambda to run in VPC
                ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaVPCAccessExecutionRole'
                ),
            ],
        });

        const resourceCodePath =
            props.sourceCodePath ?? path.resolve(__dirname, this.LAMBDA_RELATIVE_PATH);
        // Development escape
        const skipCodeSigning =
            props.skipCodeSigning || !!this.node.tryGetContext('skipCodeSigning');
        this.function = new Function(this, `${id}Function`, {
            ...(!skipCodeSigning && {
                codeSigningConfig: this.createCodeSigningConfig(),
            }),
            code: Code.fromAsset(resourceCodePath, { exclude: ['tests'] }),
            timeout: Duration.seconds(300),
            runtime: props.pythonRuntime ?? DEFAULT_PYTHON_VERSION,
            memorySize: 1024,
            tracing: Tracing.ACTIVE,
            role: functionRole,
            layers: [
                ...this.createDependencyLayer(props.functionName, resourceCodePath),
                ...(props.layers ?? []),
            ],
            deadLetterQueueEnabled: true,
            environment: {
                ...props.environment,
            },
            ...props,
        });
    }

    private createCodeSigningConfig() {
        const signingProfile = new SigningProfile(this, 'SigningProfile', {
            platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
        });

        return new CodeSigningConfig(this, 'CodeSigningConfig', {
            signingProfiles: [signingProfile],
        });
    }

    createDependencyLayer(functionName: string, sourcePath: string): LayerVersion[] {
        const requirementsFile = path.resolve(
            sourcePath,
            `requirements.${functionName}.txt`
        );
        const commonLayer = getPythonCommonDependencyLayer(this, sourcePath);
        if (fs.existsSync(requirementsFile)) {
            const applicationLayer = createDependencyLayer(
                this,
                functionName,
                requirementsFile
            );
            return [commonLayer, applicationLayer];
        } else {
            return [commonLayer];
        }
    }
}
