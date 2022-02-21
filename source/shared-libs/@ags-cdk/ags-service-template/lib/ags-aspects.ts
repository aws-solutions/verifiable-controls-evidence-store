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
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { IConstruct } from 'constructs';

export class PermissionsBoundary implements cdk.IAspect {
    constructor(private readonly permissionsBoundaryArn: string) {}

    public visit(node: IConstruct): void {
        if (
            node instanceof iam.CfnRole ||
            (node instanceof cdk.CfnResource &&
                cdk.CfnResource.isCfnResource(node) &&
                node.cfnResourceType === 'AWS::IAM::Role')
        ) {
            node.addPropertyOverride('PermissionsBoundary', this.permissionsBoundaryArn);
        }
    }
}

export class OptionMethodNoAuth implements cdk.IAspect {
    public visit(node: IConstruct): void {
        if (node instanceof apigateway.CfnMethod && node.httpMethod === 'OPTIONS') {
            node.addPropertyOverride(
                'AuthorizationType',
                apigateway.AuthorizationType.NONE
            );
        }
    }
}
