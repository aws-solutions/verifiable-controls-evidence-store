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
import {
    IVpc,
    Vpc,
    IInterfaceVpcEndpoint,
    InterfaceVpcEndpoint,
    SubnetSelection,
    ISecurityGroup,
    SecurityGroup,
} from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import {
    DeploymentOptions,
    SubnetGroup,
    SubnetMapping,
    SubnetMappingOptions,
} from './ags-types';

// SSM Parameter Names
const SSM_DEPLOYMENT_OPTIONS = '/ags/deploymentOptions';
const SSM_VPC_ID = '/ags/vpcId';
const SSM_VPC_ENDPOINT_ID = '/ags/apigatewayVpcEndpointId';
const SSM_PERMISSION_BOUNDARY_POLICY_ARN = '/ags/permissionBoundaryPolicyArn';
const SSM_WEB_DIST_ID = '/ags/webClientDistributionId';
const SSM_SUBNET_MAPPING = '/ags/subnetmapping';
const SSM_ES_SERVICE_LINKED_ROLE_AVILABLE =
    '/ags/elasticSearchServiceLinkedRoleAvailable';
const SSM_CUSTOM_API_RESOURCE_POLICY = '/ags/customAPIResourcePolicyJSON';
const SSM_API_WEB_ACL_ARN = '/ags/apigatewayWebAclArn';

export class AGSSharedInfraClient extends Construct {
    // shared infra context
    /**
     * Name of the configuration deployed by the Shared Infra in the target environment.
     *
     */
    public readonly configName: string;
    /**
     * Deployment options of the Shared Infra in the target environment.
     *
     */
    public readonly deploymentOptions: DeploymentOptions;
    /**
     * A list of the AWS account IDs of the trusted development accounts.
     *
     * Services deveployed in any account in the list will be able to call APIs in the team shared account
     */
    public readonly trustedDeveloperAccounts: string[];
    /**
     * VPC in the Shared Infra in the target environment.
     *
     */
    public readonly vpc: IVpc;
    /**
     * InterfaceVPCEndpoint in the Shared Infra in the target environment.
     *
     * The InterfaceVPCEndpoint is only available when apiGatewayType in
     * deploymentOptions is set to `private`.
     * When apiGatewayType is set to `public` or `cloudfront`, this vaule is undefined
     */
    public readonly apigatewayVpcEndpoint: IInterfaceVpcEndpoint;
    /**
     * CloudFront distribution ID for Web Client deployed by Shared Infra in the target account
     *
     */
    public readonly webDistributionId: string;

    /**
     * Managed permission boundary policy ARN
     *
     */
    public readonly permissionBoundaryPolicyArn: string;

    /**
     * Flag indicating whether a service linked role for ElasticSearch is available in the target environment.
     */
    public readonly elasticSearchServiceLinkedRoleAvailable: boolean;

    /**
     * JSON Text for additonal custom APIGateway resource policy. Set to NONE to indicate there is no custom API resource policy
     */
    public readonly customAPIResourcePolicyJSON: string;

    /**
     * ARN of WAF Web ACL for APIGateway APIs
     */
    public readonly apiGatewayWebAclArn: string;

    private readonly subnetMapping: {
        [key in SubnetGroup]: {
            subnetGroupName: string;
            securityGroups: ISecurityGroup[] | undefined;
        };
    };

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.deploymentOptions = this.readJSONParameter(SSM_DEPLOYMENT_OPTIONS, {
            apiGatewayType: 'private',
            bastionInstance: false,
            developmentUserRole: true,
            trustedDeveloperAccounts: '',
        });
        this.trustedDeveloperAccounts = (
            this.deploymentOptions.trustedDeveloperAccounts || ''
        ).split(',');

        this.customAPIResourcePolicyJSON = this.readStringParameter(
            SSM_CUSTOM_API_RESOURCE_POLICY,
            'NONE'
        );

        // lookup vpc
        const vpcId = ssm.StringParameter.valueFromLookup(this, SSM_VPC_ID);
        this.vpc = Vpc.fromLookup(this, 'vpc', {
            vpcId,
        });

        // look up apigatewayVpcEndpointId only when APIGateway is in private setting
        if (this.deploymentOptions.apiGatewayType === 'private') {
            const vpcEndpointId = ssm.StringParameter.valueFromLookup(
                this,
                SSM_VPC_ENDPOINT_ID
            );
            this.apigatewayVpcEndpoint =
                InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(
                    this,
                    'apigatewayVpcEndpoint',
                    {
                        vpcEndpointId,
                        port: 443,
                    }
                );
        }

        // look up permission boundary policy arn from shared infra
        const policyArn = ssm.StringParameter.valueFromLookup(
            this,
            SSM_PERMISSION_BOUNDARY_POLICY_ARN
        );

        this.permissionBoundaryPolicyArn = /arn:aws:iam::[0-9]+:policy\/.+/.test(
            policyArn
        )
            ? policyArn
            : '';

        // look up web distribution id
        this.webDistributionId = ssm.StringParameter.valueFromLookup(
            this,
            SSM_WEB_DIST_ID
        );

        // look up subnet mapping
        const subnetMappingOptions = this.readJSONParameter<SubnetMappingOptions>(
            SSM_SUBNET_MAPPING,
            {
                ingress: {
                    subnetGroupName: 'ingress',
                    securityGroupIds: [],
                },
                service: {
                    subnetGroupName: 'service',
                    securityGroupIds: [],
                },
                database: {
                    subnetGroupName: 'database',
                    securityGroupIds: [],
                },
            }
        );

        this.subnetMapping = {
            ingress: this.getSubnetSecurityGroupMapping(subnetMappingOptions.ingress),
            service: this.getSubnetSecurityGroupMapping(subnetMappingOptions.service),
            database: this.getSubnetSecurityGroupMapping(subnetMappingOptions.database),
        };

        const esServiceLinkedRoleFlag = ssm.StringParameter.valueFromLookup(
            this,
            SSM_ES_SERVICE_LINKED_ROLE_AVILABLE
        );
        this.elasticSearchServiceLinkedRoleAvailable =
            esServiceLinkedRoleFlag.toLowerCase() === 'true';

        this.apiGatewayWebAclArn = ssm.StringParameter.valueFromLookup(
            this,
            SSM_API_WEB_ACL_ARN
        );
    }

    getSubnetSecurityGroupMapping(mapping: SubnetMapping): {
        subnetGroupName: string;
        securityGroups: ISecurityGroup[] | undefined;
    } {
        return {
            subnetGroupName: mapping.subnetGroupName,
            securityGroups:
                mapping.securityGroupIds.length > 0
                    ? mapping.securityGroupIds.map((id) =>
                          SecurityGroup.fromSecurityGroupId(this, `sg-${id}`, id, {
                              allowAllOutbound: false,
                              mutable: false,
                          })
                      )
                    : undefined,
        };
    }

    getSubnetsByGroupName(subnetGroupName: SubnetGroup): SubnetSelection | undefined {
        return {
            subnetGroupName: this.subnetMapping[subnetGroupName].subnetGroupName,
        };
    }

    getSubnetSecurityGroups(subnetGroupName: SubnetGroup): ISecurityGroup[] | undefined {
        return this.subnetMapping[subnetGroupName].securityGroups;
    }

    /**
     * Read JSON string stored in SSM ParameterStore and return object
     *
     * This function returns a default value if the value returned from `ssm.StringParameter.valueFromLookup` is an token
     * so that the synth process can continue. It happens when cdk doesn't have this ssm parameter cached in cdk.context.json
     * 
     * During cdk synth time, SSM parameter values could be resolved into token first
     * before the real string value is fetched from the server. Once the value is fetched
     * it will be stored in cdk.context.json.
     *
     * CDK will run the same stack a few passes during the synth. The token will only
     * be resolved in the real string in the later passes but not the first pass.
     *
     * If the SSM parameter value need to be parsed and used in the stack code, the
     * stack code will only get the token in first pass and will fail and thus
     * prevent the stack synth to be completed.
     *
     * The workaround is to run cdk synth twice, with refreshContext flag in the
     * first time. When this flag is set, the stack should run some special code
     * which only retrieve SSM parameters. This will force cdk to retrieve it from
     * the environment and store it in cdk.context.json. The stack code should not
     * parse or interprete the value.
    
     * After the first synth completed (with only the SSM parameters in the stack),
     * run cdk synth again without setting this flag (refreshContext). The second
     * cdk synth will read the SSM parameter values from cdk.context.json and will pass.
     *
     * @param parameterName Name of the SSM parameter
     * @param defaultValue The default value of this SSM parameter if the value is not retrieve yet.
     * @returns JSON Object that stored in this SSM paramter or the default value
     */
    readJSONParameter<T>(parameterName: string, defaultValue: T): T {
        const value = ssm.StringParameter.valueFromLookup(this, parameterName);
        if (value === `dummy-value-for-${parameterName}`) {
            return defaultValue;
        } else {
            return JSON.parse(value);
        }
    }

    readStringParameter(parameterName: string, defaultValue: string): string {
        const value = ssm.StringParameter.valueFromLookup(this, parameterName);
        if (value === `dummy-value-for-${parameterName}`) {
            return defaultValue;
        } else {
            return value;
        }
    }
}
