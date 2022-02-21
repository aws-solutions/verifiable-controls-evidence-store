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

export interface DeploymentOptions {
    apiGatewayType: 'private' | 'public' | 'cloudfront';
    bastionInstance: boolean;
    developmentUserRole: boolean;
    trustedDeveloperAccounts: string;
}

export interface AGSEnvironment {
    account: string;
    region: string;
    configName?: string;
}

export interface SubnetMapping {
    subnetGroupName: string;
    securityGroupIds: string[];
}

export type SubnetMappingOptions = {
    [key in SubnetGroup]: SubnetMapping;
};

export type AGSEnvironments = Record<string, AGSEnvironment>;

export type Configuration = Record<string, string>;

export enum SubnetGroup {
    INGRESS = 'ingress',
    SERVICE = 'service',
    DATABASE = 'database',
}

export enum AGSRole {
    // special privilege role has default access to all APIs
    SYSTEM_ADMIN = 'SystemAdmin',

    // special role indicate no restriction
    EVERYONE = 'Everyone',

    // AGS Personas
    APPLICATION_OWNER = 'ApplicationOwner',
    APPLICATION_DEVELOPER = 'ApplicationDeveloper',
    CHIEF_RISK_OFFICE = 'ChiefRiskOffice',
    LINE_ONE_RISK = 'Line1Risk',
    LINE_TWO_RISK = 'Line2Risk',
    LINE_THREE_RISK = 'Line3Risk',
    DOMAIN_OWNER = 'DomainOwner',
    EVIDENCE_PROVIDER = 'EvidenceProvider',
    CONTROL_OWNER = 'ControlOwner',
    SERVICE_MANAGER = 'ServiceManager',
}
