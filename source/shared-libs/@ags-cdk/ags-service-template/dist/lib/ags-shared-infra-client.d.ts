import * as cdk from '@aws-cdk/core';
import { IVpc, IInterfaceVpcEndpoint, SubnetSelection, ISecurityGroup } from '@aws-cdk/aws-ec2';
import { DeploymentOptions, SubnetGroup, SubnetMapping } from './ags-types';
export declare class AGSSharedInfraClient extends cdk.Construct {
    /**
     * Name of the configuration deployed by the Shared Infra in the target environment.
     *
     */
    readonly configName: string;
    /**
     * Deployment options of the Shared Infra in the target environment.
     *
     */
    readonly deploymentOptions: DeploymentOptions;
    /**
     * A list of the AWS account IDs of the trusted development accounts.
     *
     * Services deveployed in any account in the list will be able to call APIs in the team shared account
     */
    readonly trustedDeveloperAccounts: string[];
    /**
     * VPC in the Shared Infra in the target environment.
     *
     */
    readonly vpc: IVpc;
    /**
     * InterfaceVPCEndpoint in the Shared Infra in the target environment.
     *
     * The InterfaceVPCEndpoint is only available when apiGatewayType in
     * deploymentOptions is set to `private`.
     * When apiGatewayType is set to `public` or `cloudfront`, this vaule is undefined
     */
    readonly apigatewayVpcEndpoint: IInterfaceVpcEndpoint;
    /**
     * CloudFront distribution ID for Web Client deployed by Shared Infra in the target account
     *
     */
    readonly webDistributionId: string;
    /**
     * Managed permission boundary policy ARN
     *
     */
    readonly permissionBoundaryPolicyArn: string;
    /**
     * Flag indicating whether a service linked role for ElasticSearch is available in the target environment.
     */
    readonly elasticSearchServiceLinkedRoleAvailable: boolean;
    /**
     * JSON Text for additonal custom APIGateway resource policy. Set to NONE to indicate there is no custom API resource policy
     */
    readonly customAPIResourcePolicyJSON: string;
    /**
     * ARN of WAF Web ACL for APIGateway APIs
     */
    readonly apiGatewayWebAclArn: string;
    private readonly subnetMapping;
    constructor(scope: cdk.Construct, id: string);
    getSubnetSecurityGroupMapping(mapping: SubnetMapping): {
        subnetGroupName: string;
        securityGroups: ISecurityGroup[] | undefined;
    };
    getSubnetsByGroupName(subnetGroupName: SubnetGroup): SubnetSelection | undefined;
    getSubnetSecurityGroups(subnetGroupName: SubnetGroup): ISecurityGroup[] | undefined;
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
    readJSONParameter<T>(parameterName: string, defaultValue: T): T;
    readStringParameter(parameterName: string, defaultValue: string): string;
}
