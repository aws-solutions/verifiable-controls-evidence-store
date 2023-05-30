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

export interface DeploymentOptions {
    deploymentOptions: {
        apiGatewayType: 'private' | 'public' | 'cloudfront';
        bastionInstance: boolean;
        retainData?: boolean;
        developmentUserRole: boolean;
        trustedDeveloperAccounts?: string;
        enableFederatedAuth?: boolean;
        enableWebClient?: boolean;
    };
}

export interface SubnetMapping {
    subnetGroupName: string;
    securityGroupIds: string[];
}

export interface BaseInfraProps {
    vpcCidr?: string;
    maxAZs?: number;
    subnetConfig?: [
        {
            cidrMask: number;
            name: string;
            subnetType: 'Public' | 'Private' | 'Isolated';
        }
    ];
    subnetMappings?: {
        ingress: SubnetMapping;
        service: SubnetMapping;
        database: SubnetMapping;
    };
    elasticSearchServiceLinkedRoleAvailable: boolean;
    customAPIResourcePolicyJSON: string;
    identityProvider: IdentityProviderInfo;
    allowedExternalIPRanges?: string;
}

export interface IdentityProviderInfo {
    type: 'COGNITO' | 'SAML';
    // SAML Attributes
    url?: string;
    audience?: string;
    arn?: string;
    loginUrl: string;
    displayNameAttributeName: string;
    userGroupAttributeName: string;
}

export interface WebClientConfig {
    webACLId?: string;
}

export type AGSConfiguration = BaseInfraProps & DeploymentOptions & WebClientConfig;

export type CommonProps = {
    serviceName: string;
    envName: string;
    configName: string;
    configuration: AGSConfiguration;
    sharedInfraVersion: string;
    solutionInfo?: Record<string, string>;
};

export type AGSSharedInfraStageProps = cdk.StageProps & CommonProps;

export type AGSBaseInfraStackProps = cdk.StackProps & CommonProps;

export type AGSWebClientStackProps = cdk.StackProps & CommonProps;
