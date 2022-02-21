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
export enum AGS_SSM_PARAMETERS {
    CONFIG_NAME = '/ags/configName',
    SHAREDINFRA_VERSION = '/ags/sharedInfraVersion',
    DEPLOYMENT_OPTIONS = '/ags/deploymentOptions',
    CUSTOM_API_RESOURCE_POLICY = '/ags/customAPIResourcePolicyJSON',
    VPC_ID = '/ags/vpcId',
    SUBNET_MAPPING = `/ags/subnetmapping`,
    API_VPC_ENDPOINT_ID = '/ags/apigatewayVpcEndpointId',
    PERMISSION_BOUNDARY_POLICY_ARN = '/ags/permissionBoundaryPolicyArn',
    WEB_DIST_ID = '/ags/webClientDistributionId',
    ES_SERVICE_LINKED_ROLE_AVILABLE = '/ags/elasticSearchServiceLinkedRoleAvailable',
    API_WEB_ACL_ARN = '/ags/apigatewayWebAclArn',
}
