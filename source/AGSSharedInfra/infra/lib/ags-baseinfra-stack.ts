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
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

import {
    AGSBaseInfraStackProps,
    AGSConfiguration,
    IdentityProviderInfo,
} from './ags-types';
import {
    BastionHostLinux,
    FlowLog,
    FlowLogDestination,
    FlowLogResourceType,
    ISubnet,
    InterfaceVpcEndpoint,
    InterfaceVpcEndpointAwsService,
    IpAddresses,
    NatProvider,
    SubnetConfiguration,
    SubnetType,
    Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { addCfnNagSuppression, addCfnNagSuppressionMeta } from './cfn-nag-suppression';

import { AGS_SSM_PARAMETERS } from './ssm-parameter-names';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';
import { kmsLogGroupPolicyStatement } from './kms-loggroup-policy';

export class AGSBaseInfraStack extends cdk.Stack {
    public readonly configuration: AGSConfiguration;
    public vpc: Vpc;
    public externalUserRoleArn: string;

    constructor(scope: Construct, id: string, props: AGSBaseInfraStackProps) {
        super(scope, id, props);
        this.configuration = props.configuration;

        // create network infrastructure
        this.createVpc();

        this.createMiscSSMParameters(props);

        // create the IAM roles that is required by AGS Services
        this.createIAMRoles();

        // create managed lambda execution policies that shared with all lambda constructs
        this.createAGSLambdaExecutionPolicies();

        // create WAF ACL for apigateway
        this.createAPIGatewayWAFAcls();

        // bastion box
        if (this.configuration.deploymentOptions.bastionInstance) {
            new BastionHostLinux(this, 'bastion', {
                vpc: this.vpc,
            });
        }
    }

    private createVpc() {
        const defaultSubnetConfiguration = [
            {
                cidrMask: 24,
                name: 'ingress',
                subnetType: SubnetType.PUBLIC,
                mapPublicIpOnLaunch: false,
            },
            {
                cidrMask: 24,
                name: 'service',
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            },
            {
                cidrMask: 28,
                name: 'database',
                subnetType: SubnetType.PRIVATE_ISOLATED,
            },
        ];

        const vpcCidr = this.configuration.vpcCidr || Vpc.DEFAULT_CIDR_RANGE;
        const subnetConfig = (this.configuration.subnetConfig ||
            defaultSubnetConfiguration) as SubnetConfiguration[];
        const maxAZs = this.configuration.maxAZs || 2;

        this.vpc = new Vpc(this, 'vpc', {
            ipAddresses: IpAddresses.cidr(vpcCidr),
            enableDnsHostnames: true,
            enableDnsSupport: true,
            maxAzs: maxAZs,
            natGatewayProvider: NatProvider.gateway(),
            natGatewaySubnets: { subnetType: SubnetType.PUBLIC },
            natGateways: maxAZs,
            subnetConfiguration: subnetConfig,
        });

        this.tagSubnetsForEks();

        // setup vpc flowlog
        const kmsKey = new kms.Key(this, 'VpcFlowLogKey', {
            enableKeyRotation: true,
            removalPolicy: this.configuration.deploymentOptions.retainData
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });
        const vpcFlowLogLogGroup = new logs.LogGroup(this, 'VpcFlowLogLogGroup', {
            encryptionKey: kmsKey,
            removalPolicy: this.configuration.deploymentOptions.retainData
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        kmsKey.addToResourcePolicy(kmsLogGroupPolicyStatement);

        const vpcFlowLogRole = new iam.Role(this, 'VpcFlowLogRole', {
            assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        });
        new FlowLog(this, 'VpcFlowLog', {
            resourceType: FlowLogResourceType.fromVpc(this.vpc),
            destination: FlowLogDestination.toCloudWatchLogs(
                vpcFlowLogLogGroup,
                vpcFlowLogRole
            ),
        });

        // set vpc id to ssm parameter
        new ssm.StringParameter(this, 'vpcId', {
            parameterName: AGS_SSM_PARAMETERS.VPC_ID,
            stringValue: `${this.vpc.vpcId}`,
        });

        // set subnet and security group mappings to ssm parameter
        const defaultSubnetMapping = {
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
        };

        new ssm.StringParameter(this, 'subnetMappings', {
            parameterName: AGS_SSM_PARAMETERS.SUBNET_MAPPING,
            stringValue: this.configuration.subnetMappings
                ? JSON.stringify(this.configuration.subnetMappings)
                : JSON.stringify(defaultSubnetMapping),
        });

        // VPC Interface Endpoint for Private APIGateway
        let apigatewayVpcEndpointId = 'NONE';
        const apiGatewayType =
            this.configuration.deploymentOptions.apiGatewayType || 'cloudfront';
        if (apiGatewayType === 'private') {
            const vpcEndPoint = new InterfaceVpcEndpoint(this, 'vpcEndPoint', {
                service: InterfaceVpcEndpointAwsService.APIGATEWAY,
                vpc: this.vpc,
                lookupSupportedAzs: false,
                open: true,
                privateDnsEnabled: true,
                subnets: {
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                },
            });

            apigatewayVpcEndpointId = vpcEndPoint.vpcEndpointId;
        }

        // set to ssm parameter for Apigateway VpcEndpoint ID
        new ssm.StringParameter(this, 'apigatewayVpcEndpointId', {
            parameterName: AGS_SSM_PARAMETERS.API_VPC_ENDPOINT_ID,
            stringValue: apigatewayVpcEndpointId,
        });

        // DEPRECATED but still keep for backward compatibility
        new ssm.StringParameter(this, 'vpcEndpointId', {
            parameterName: '/ags/vpcEndpointId',
            stringValue: apigatewayVpcEndpointId,
        });
    }

    private tagSubnetsForEks() {
        const tagSubnets = (subnets: ISubnet[], tag: string) => {
            for (const subnet of subnets) {
                Tags.of(subnet).add(tag, '1');
            }
        };

        // https://docs.aws.amazon.com/eks/latest/userguide/network_reqs.html
        tagSubnets(this.vpc.privateSubnets, 'kubernetes.io/role/internal-elb');
        tagSubnets(this.vpc.publicSubnets, 'kubernetes.io/role/elb');
    }

    private createMiscSSMParameters(props: AGSBaseInfraStackProps) {
        // set shared infra version
        new ssm.StringParameter(this, 'sharedInfraVersion', {
            parameterName: AGS_SSM_PARAMETERS.SHAREDINFRA_VERSION,
            stringValue: JSON.stringify(props.sharedInfraVersion),
        });

        // set deployment options to ssm parameter
        new ssm.StringParameter(this, 'deploymentOptions', {
            parameterName: AGS_SSM_PARAMETERS.DEPLOYMENT_OPTIONS,
            stringValue: JSON.stringify(this.configuration.deploymentOptions),
        });

        // set custom API resource policy
        new ssm.StringParameter(this, 'customAPIResourcePolicyJSON', {
            parameterName: AGS_SSM_PARAMETERS.CUSTOM_API_RESOURCE_POLICY,
            stringValue: this.configuration.customAPIResourcePolicyJSON ?? 'NONE',
        });

        // create elastic search service linked role SSM parameter
        new ssm.StringParameter(this, 'elasticSearchServiceLinkedRoleAvailable', {
            parameterName: AGS_SSM_PARAMETERS.ES_SERVICE_LINKED_ROLE_AVILABLE,
            stringValue:
                this.configuration.elasticSearchServiceLinkedRoleAvailable.toString(),
        });

        // set a NONE for permission boundary policy arn id to ags ssm parameter for now
        new ssm.StringParameter(this, 'permissionBoundaryPolicyArn', {
            parameterName: AGS_SSM_PARAMETERS.PERMISSION_BOUNDARY_POLICY_ARN,
            stringValue: 'NONE',
        });

        {
            // FOR BACKWARD-COMPATITIBILITY to the AGS Services that havn't been migrated to use configuration files
            // This should be removed after all AGS Services migrate to use configuration files
            let obsoleteConfigName = props.configName;
            if (props.configName === 'TeamDev') {
                obsoleteConfigName = 'SharedDev';
            } else if (props.configName === 'TeamStaging') {
                obsoleteConfigName = 'SharedStaging';
            }

            new ssm.StringParameter(this, 'configName', {
                parameterName: AGS_SSM_PARAMETERS.CONFIG_NAME,
                stringValue: obsoleteConfigName,
            });
        }
    }

    // Lambda Generic Execution Policy
    private createAGSLambdaExecutionPolicies() {
        const logGroupStatements = [
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['logs:CreateLogGroup', 'logs:CreateLogStream'],
                resources: [
                    `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:*`,
                ],
            }),

            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['logs:PutLogEvents'],
                resources: [
                    `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:*:log-stream:*`,
                ],
            }),
        ];

        const lambdaBasicExecutionPolicy = new iam.ManagedPolicy(
            this,
            'LambdaBasicExecutionPolicy',
            {
                managedPolicyName: 'AGSLambdaBasicExecutionPolicy',
                description:
                    'A scoped down managed policy to replace default AWSLambdaBasicExecutionRole',
                statements: [...logGroupStatements],
            }
        );

        addCfnNagSuppression(lambdaBasicExecutionPolicy, [
            {
                id: 'W28',
                reason: 'Managed policy resource need explicit name to be referenced',
            },
        ]);

        const lambdaVPCAccessExecutionPolicy = new iam.ManagedPolicy(
            this,
            'LambdaVPCAccessExecutionPolicy',
            {
                managedPolicyName: 'AGSLambdaVPCAccessExecutionPolicy',
                description:
                    'A scoped down managed policy to replace default AWSLambdaVPCAccessExecutionRole',
                statements: [
                    ...logGroupStatements,
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            'ec2:CreateNetworkInterface',
                            'ec2:DeleteNetworkInterface',
                            'ec2:AssignPrivateIpAddresses',
                            'ec2:UnassignPrivateIpAddresses',
                        ],
                        resources: [
                            `arn:aws:ec2:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`,
                        ],
                    }),
                    // ec2:DescribeNetworkInterfaces doesn't support resource-level permission and has to use All resources
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: ['ec2:DescribeNetworkInterfaces'],
                        resources: ['*'],
                    }),
                ],
            }
        );

        addCfnNagSuppression(lambdaVPCAccessExecutionPolicy, [
            {
                id: 'W13',
                reason: 'ec2:DescribeNetworkInterfaces does not support resource-level permission and has to use All resources',
            },
            {
                id: 'W28',
                reason: 'Managed policy resource need explicit name to be referenced',
            },
        ]);
    }

    private createIAMRoles() {
        // check minimum infra
        const enableWebClient = !!this.configuration.deploymentOptions.enableWebClient;

        const assumeRoleByRootPolicy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    principals: [new iam.AccountRootPrincipal()],
                    actions: ['sts:AssumeRole'],
                }),
            ],
        });

        if (enableWebClient && !this.configuration.identityProvider) {
            throw new Error(
                'Web client is enabled but identity provider information is not specified in the configuration.'
            );
        }

        // IAM Identity Provider if Federated Authentication is enabled
        const assumeRolePolicyDocument = enableWebClient
            ? this.createIdentityProviderPolicyDoc(this.configuration.identityProvider)
            : assumeRoleByRootPolicy;

        // IAM Policy for external & developement users to read SSM parameters
        const statement = new iam.PolicyStatement({ effect: iam.Effect.ALLOW });
        statement.addActions(
            'ssm:GetParameter',
            'ssm:GetParameters',
            'ssm:GetParametersByPath'
        );
        statement.addResources(
            `arn:aws:ssm:${this.region}:${this.account}:parameter/ags/*`
        );
        const ssmPolicyDoc = new iam.PolicyDocument({
            statements: [statement],
        });

        // IAM Role for external users
        const externalUserRole = new iam.CfnRole(this, 'agsExternalUserRole', {
            roleName: 'AGSExternalUserRole',
            assumeRolePolicyDocument,
            policies: [
                { policyName: 'AGSSSMParametersPolicy', policyDocument: ssmPolicyDoc },
            ],
        });
        this.externalUserRoleArn = externalUserRole.attrArn;

        addCfnNagSuppressionMeta(externalUserRole, [
            {
                id: 'W28',
                reason: 'This IAM Role need explicit name to be referenced',
            },
        ]);

        // IAM Role for development users
        if (this.configuration.deploymentOptions.developmentUserRole) {
            const developmentUserRole = new iam.Role(this, 'agsDevelopmentUserRole', {
                roleName: 'AGSDevelopmentUserRole',
                assumedBy: new iam.AccountRootPrincipal(),
                inlinePolicies: {
                    AGSSSMParametersPolicy: ssmPolicyDoc,
                },
            });

            addCfnNagSuppression(developmentUserRole, [
                {
                    id: 'W28',
                    reason: 'This IAM Role need explicit name to be referenced',
                },
            ]);
        }
    }

    private createAPIGatewayWAFAcls() {
        const webAcl = new wafv2.CfnWebACL(this, 'WAFApiGateway', {
            name: 'AGSAPIGatewayWebACL',
            description: 'AGS ApiGateway WebACL',
            defaultAction: {
                allow: {},
            },
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'AGSApiGateway',
                sampledRequestsEnabled: true,
            },
            rules: [
                {
                    name: 'AWS-AWSManagedRulesCommonRuleSet',
                    priority: 0,
                    statement: {
                        managedRuleGroupStatement: {
                            name: 'AWSManagedRulesCommonRuleSet',
                            vendorName: 'AWS',
                            excludedRules: [
                                {
                                    name: 'GenericRFI_BODY',
                                },
                                {
                                    name: 'GenericLFI_BODY',
                                },

                                {
                                    name: 'SizeRestrictions_BODY',
                                },
                            ],
                        },
                    },
                    overrideAction: {
                        none: {},
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'AWS-AWSManagedRulesCommonRuleSet',
                        sampledRequestsEnabled: true,
                    },
                },
                {
                    name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
                    priority: 1,
                    statement: {
                        managedRuleGroupStatement: {
                            name: 'AWSManagedRulesKnownBadInputsRuleSet',
                            vendorName: 'AWS',
                        },
                    },
                    overrideAction: {
                        none: {},
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
                        sampledRequestsEnabled: true,
                    },
                },
            ],
        });

        // set to ssm parameter for Apigateway Web ACL
        new ssm.StringParameter(this, 'apigatewayWebAclArn', {
            parameterName: AGS_SSM_PARAMETERS.API_WEB_ACL_ARN,
            stringValue: webAcl.attrArn,
        });
    }

    // Helper functions
    private createIdentityProviderPolicyDoc(
        idp: IdentityProviderInfo
    ): iam.PolicyDocument {
        const statements: iam.PolicyStatement[] = [];
        if (idp.type === 'COGNITO') {
            statements.push(this.getCognitoPolicyStatement());
        } else if (idp.type === 'SAML') {
            // Unfortunately neither CDK nor Cfn provides a way to create SAML provider. The only way to
            // create it is to use API, in the way described in this blog below. Will get back to it and
            // write a construct similar to iam.OpenIdConnectProvider for SAML. At the moment, SAML provider
            // has to be created manually and specify the ARN in the profile.
            // https://aws.amazon.com/blogs/security/how-to-create-saml-providers-with-aws-cloudformation/
            if (idp.arn) {
                statements.push(this.getSAMLFederatedPolicyStatement(idp.arn));
            }
        }

        const policyDoc = new iam.PolicyDocument();
        policyDoc.addStatements(...statements);
        return policyDoc;
    }

    private getCognitoPolicyStatement(): iam.PolicyStatement {
        const statement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
        });
        statement.addFederatedPrincipal('cognito-identity.amazonaws.com', {
            'ForAnyValue:StringLike': {
                'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
        });
        statement.addActions('sts:AssumeRoleWithWebIdentity', 'sts:TagSession');
        return statement;
    }

    private getSAMLFederatedPolicyStatement(providerArn: string): iam.PolicyStatement {
        const statement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
        });
        statement.addFederatedPrincipal(providerArn, {});
        statement.addActions('sts:AssumeRoleWithSAML', 'sts:TagSession');
        return statement;
    }
}
