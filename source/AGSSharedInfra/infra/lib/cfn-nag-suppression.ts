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
import { IAspect, CfnResource } from 'aws-cdk-lib';

const METADATA_TYPE = 'cfn_nag';
const SUPRESSION_KEY = 'rules_to_suppress';

export interface CfnNagRuleSuppression {
    id: string;
    reason: string;
}

/**
 * Adds cfn nag suppressions to the given construct
 */
export const addCfnNagSuppressionMeta = (
    construct: CfnResource,
    rulesToSuppress: CfnNagRuleSuppression[]
): void => {
    construct.cfnOptions.metadata = {
        ...construct.cfnOptions.metadata,
        [METADATA_TYPE]: {
            ...construct.cfnOptions.metadata?.cfn_nag,
            [SUPRESSION_KEY]: [
                ...(construct.cfnOptions.metadata?.cfn_nag?.rules_to_suppress || []),
                ...rulesToSuppress,
            ],
        },
    };
};

export const addCfnNagSuppression = (
    construct: Construct,
    rulesToSuppress: CfnNagRuleSuppression[],
    resourceName?: string
): void => {
    const child = resourceName ? construct.node.findChild(resourceName) : construct;
    if (child)
        addCfnNagSuppressionMeta(child.node.defaultChild as CfnResource, rulesToSuppress);
};

export class CfnNagCustomResourceSuppressionAspect implements IAspect {
    public visit(construct: Construct): void {
        if (
            construct.node.path.endsWith(
                '/Custom::S3AutoDeleteObjectsCustomResourceProvider/Handler'
            ) ||
            construct.node.path.endsWith(
                '/CustomAttributeMapping/customerProvierLambda/Resource'
            ) ||
            construct.node.path.endsWith(
                '/CustomAttributeMapping/customProvider/framework-onEvent/Resource'
            )
        ) {
            // Enabling auto delete objects on an s3 bucket creates a lambda, which is created via CfnResource
            addCfnNagSuppressionMeta(construct as CfnResource, [
                {
                    id: 'W58',
                    reason: 'Lambda already has the required permission to write CloudWatch Logs via arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole.',
                },
                {
                    id: 'W89',
                    reason: 'Custom resource lambda functions is not necessary to be deployed in a VPC',
                },
                {
                    id: 'W92',
                    reason: 'Custom resource lambda function is created by CDK and CloudFormation',
                },
            ]);
        }
    }
}
