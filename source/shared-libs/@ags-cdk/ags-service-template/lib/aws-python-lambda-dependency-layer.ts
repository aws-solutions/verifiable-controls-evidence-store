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

import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Annotations, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as child_process from 'child_process';
import * as path from 'path';
export const DEFAULT_PYTHON_VERSION = Runtime.PYTHON_3_9;

const cachedCommonLayer = new Map<string, LayerVersion>();
const ID = 'DEFAULT_ID_PYTHON_COMMON_LAYER';
const DEFAULT_FUNCTION_NAME = 'lambda-common';
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getPythonCommonDependencyLayer(scope: Construct, sourceCodePath: string) {
    const stackIdentifier = Stack.of(scope).stackName;
    if (!cachedCommonLayer.get(stackIdentifier)) {
        cachedCommonLayer.set(
            stackIdentifier,
            new PythonLambdaLayerVersion(scope, { sourceCodePath }).layer
        );
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return cachedCommonLayer.get(stackIdentifier)!;
}

export function createDependencyLayer(
    scope: Construct,
    functionName: string,
    dependencySpecPath: string
): LayerVersion {
    const outputDir = `.build/${functionName}`;
    const pipeInstallCmd = `pip install -r ${dependencySpecPath} -t ${outputDir}/python`;
    try {
        child_process.execSync(pipeInstallCmd);
    } catch (error) {
        Annotations.of(scope).addError('Error installing python dependencies abort');
    }

    const layerID = `${functionName}-dependencies`;
    const code = Code.fromAsset(outputDir);

    return new LayerVersion(scope, layerID, {
        code: code,
        compatibleRuntimes: [DEFAULT_PYTHON_VERSION],
        license: 'Apache-2.0',
        layerVersionName: `${functionName}-layer`,
        description: 'A layer to load the python dependencies',
    });
}

interface PythonLambdaLayerVersionProperties {
    sourceCodePath: string;
}
/**
 * Python lambda common dependency layer construct
 */
class PythonLambdaLayerVersion extends Construct {
    public readonly layer: LayerVersion;

    constructor(scope: Construct, props: PythonLambdaLayerVersionProperties) {
        super(scope, ID);
        this.layer = createDependencyLayer(
            this,
            DEFAULT_FUNCTION_NAME,
            path.resolve(props.sourceCodePath, 'requirements.txt')
        );
    }
}
