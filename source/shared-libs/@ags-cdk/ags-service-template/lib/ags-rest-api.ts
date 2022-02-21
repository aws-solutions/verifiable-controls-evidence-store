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
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { AGSLambdaFunction } from './ags-lambda-function';
import { AGSService } from './ags-service';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { OptionMethodNoAuth } from './ags-aspects';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { AGSRole } from './ags-types';
import { Construct } from 'constructs';

export interface ApiEndpoint {
    resourcePath: string;
    httpMethod: string;
}

export interface AGSApiExternalUserPermission {
    endpoints: ApiEndpoint[];
    allowedAGSRoles: AGSRole[];
    exactMatch?: boolean;
}

export interface AGSRestApiProps {
    /**
     * AGS Service Object
     */
    service: AGSService;
    /**
     * A Lambda Function to handle API Request
     */
    lambdaFunction: AGSLambdaFunction;
    /**
     * A list of permissions for AGS External Users
     *
     * AGS External User can be granted permission on each individual API endpoint (resource and method).
     * The permission is granted by matching the AGSRole names that are specified in the user profile against
     * the allowedAGSRoles specified in apiExternalUserPermissions
     *
     * Multiple API endpoints can be specified in one AGSApiExternalUserPermission and also multiple AGS Roles.
     * The user will be allowed to access all API endpoints listed in the AGSApiExternalUserPermissionas long as
     * the user has any of the specified allowed AGS Roles in the user profile.
     *
     * @example
     *   Allow DomainOwner or Line1Risk to access List and GetDetails API endpoints.
     *   [
     *       {
     *           endpoints: [
     *               {
     *                   resourcePath: 'controlobjectives',
     *                   httpMethod: 'GET',
     *               },
     *               {
     *                   resourcePath: 'controlobjectives/*',
     *                   httpMethod: 'GET',
     *               },
     *           ],
     *           allowedAGSRoles: [AGSRole.DOMAIN_OWNER, AGSRole.LINE_ONE_RISK],
     *       },
     *   ];
     *
     *   Use exactMatch if there is overlapped resource path. This example below only allow `ChiefRiskOffice`
     *   to access `PUT /businessunits/enterprise`, even DomainOwner is allowed to access `PUT /businessunits/*`
     *   [
     *       {
     *           endpoints: [
     *               {
     *                   resourcePath: 'businessunits/enterprise',
     *                   httpMethod: 'PUT',
     *               },
     *           ],
     *           allowedAGSRoles: [AGSRole.CHIEF_RISK_OFFICE],
     *           exactMatch: true,
     *       },
     *       {
     *           endpoints: [
     *               {
     *                   resourcePath: 'businessunits/*',
     *                   httpMethod: 'PUT',
     *               },
     *           ],
     *           allowedAGSRoles: [AGSRole.DOMAIN_OWNER],
     *       },
     *   ];
     *
     *
     *   Allow everyone to access all API endpoints (No Restriction)
     *   [
     *       {
     *           endpoints: [
     *               {
     *                   resourcePath: '*',
     *                   httpMethod: '*',
     *               },
     *           ],
     *           allowedAGSRoles: [AGSRole.EVERYONE],
     *       },
     *   ];
     */
    apiExternalUserPermissions: AGSApiExternalUserPermission[];
    /**
     * A list of AGS Service Names that allow access to this API.
     *
     * This is to control which AGS Service can access to this API.
     *
     * Valid value is `/^([a-zA-Z0-9\-_]*|\*)$/`. Either a name made of upper/lower case letters, hypen,
     * underscore, or a single astreroid (*) to allow ALL.
     *
     * @default * - allow ALL access
     */
    allowedServiceNames?: string[];
    /**
     *
     * Indicate whether or not proxy all requests to the default lambda handler
     *
     * If true, route all requests to the Lambda Function.
     *
     * If set to false, you will need to explicitly define the API model using
     * `addResource` and `addMethod` (or `addProxy`).
     *
     * @default true
     */
    enableProxyAll?: boolean;
    /**
     *
     * Indicate whether or not use lambda alias
     *
     * If true, create lambda alias as API gateway target
     *
     *
     * @default false
     */
    enableAlias?: boolean;
    /**
     * Allow invoking method from AWS Console UI (for testing purposes).
     *
     * This will add another permission to the AWS Lambda resource policy which
     * will allow the `test-invoke-stage` stage to invoke this handler. If this
     * is set to `false`, the function will only be usable from the deployment
     * endpoint.
     *
     * @default true
     */
    allowTestInvoke?: boolean;
}

export class AGSRestApi extends Construct {
    public readonly api: apigateway.LambdaRestApi;
    public readonly versionAlias: lambda.Alias;
    public readonly apiUrl: string;

    constructor(scope: Construct, id: string, props: AGSRestApiProps) {
        super(scope, id);

        const service = props.service;
        const sharedInfraClient = service.sharedInfraClient;
        const deploymentOptions = sharedInfraClient.deploymentOptions;

        // Check ApiGateway type to decide if use VpcEndpoint
        const useVpcEndpoint = deploymentOptions.apiGatewayType === 'private';

        // compose VpcEndpoint setting
        let endpointConfig = undefined;
        if (useVpcEndpoint) {
            endpointConfig = {
                types: [apigateway.EndpointType.PRIVATE],
                vpcEndpoints: [sharedInfraClient.apigatewayVpcEndpoint],
            };
        } else {
            endpointConfig = {
                types: [apigateway.EndpointType.EDGE],
            };
        }

        this.versionAlias = new lambda.Alias(this, 'alias', {
            aliasName: 'prod',
            version: props.lambdaFunction.lambdaFunction.currentVersion,
        });

        const gwTarget: lambda.IFunction = props.enableAlias
            ? this.versionAlias
            : props.lambdaFunction.lambdaFunction;

        this.api = new apigateway.RestApi(this, `API`, {
            description: `Rest Api for ${service.serviceName}`,
            defaultIntegration: new apigateway.LambdaIntegration(gwTarget, {
                proxy: true, //lambda proxy should be always on
                allowTestInvoke: props.allowTestInvoke,
            }),
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
            },
            defaultMethodOptions: {
                authorizationType: apigateway.AuthorizationType.IAM,
            },
            policy: this.composeApiResourcePolicy(
                service,
                props.apiExternalUserPermissions,
                props.allowedServiceNames
            ),
            endpointConfiguration: endpointConfig,
            deployOptions: { metricsEnabled: true, tracingEnabled: true },
            restApiName: `${service.serviceName}-API`,
        });

        // add CORS header to APIGateway Default 4xx and 5xx responses
        // so that browser can receive the status code and error message
        this.api.addGatewayResponse('default-4xx', {
            type: apigateway.ResponseType.DEFAULT_4XX,
            responseHeaders: {
                'access-control-allow-origin': `'*'`,
            },
        });

        this.api.addGatewayResponse('default-5xx', {
            type: apigateway.ResponseType.DEFAULT_5XX,
            responseHeaders: {
                'access-control-allow-origin': `'*'`,
            },
        });

        if (props.enableProxyAll !== false) {
            this.api.root.addProxy();

            // Make sure users cannot call any other resource adding function
            this.api.root.addResource = addResourceThrows;
            this.api.root.addMethod = addMethodThrows;
            this.api.root.addProxy = addProxyThrows;
        }

        // Set OPTIONS method with NONE authentication for browser to access.
        // Based on W3 spec, CORS-preflight request never includes credentials.
        // https://fetch.spec.whatwg.org/#cors-protocol-and-credentials
        cdk.Aspects.of(this.api).add(new OptionMethodNoAuth());

        // associate WAF WebACL to APIGateway if WebACL ARN is specified
        if (sharedInfraClient.apiGatewayWebAclArn.startsWith('arn:aws:wafv2', 0)) {
            const webACLAssociation = new wafv2.CfnWebACLAssociation(
                this,
                'WebACLAssociation',
                {
                    resourceArn: `arn:${cdk.Aws.PARTITION}:apigateway:${cdk.Aws.REGION}::/restapis/${this.api.restApiId}/stages/prod`,
                    webAclArn: sharedInfraClient.apiGatewayWebAclArn,
                }
            );
            webACLAssociation.node.addDependency(this.api);
        }

        // ssm parameter for ApiGateway Endpoint URL
        this.apiUrl = useVpcEndpoint
            ? `https://${this.api.restApiId}-${sharedInfraClient.apigatewayVpcEndpoint.vpcEndpointId}.execute-api.${cdk.Aws.REGION}.${cdk.Aws.URL_SUFFIX}/${this.api.deploymentStage.stageName}/`
            : this.api.url;

        new ssm.StringParameter(this, 'ApiUrl', {
            parameterName: `/ags/endpoints/${service.serviceName}`,
            stringValue: this.apiUrl,
        });

        new ssm.StringParameter(this, 'ApiHost', {
            parameterName: `/ags/hostnames/${service.serviceName}`,
            stringValue: `${this.api.restApiId}.execute-api.${cdk.Aws.REGION}.${cdk.Aws.URL_SUFFIX}`,
        });

        // check ApiGateway type to decide if added it to CloudFront
        if (deploymentOptions.apiGatewayType === 'cloudfront') {
            // TODO: Use DistributionOriginAttachment custom resource in Shared Infra
            // to add the APIGateway as CustomOrigin to the CloudFront distribution
            console.log('APIGateway Type cloudfront is not support yet');
        }
    }

    private composeApiResourcePolicy(
        service: AGSService,
        apiExternalUserPermissions: AGSApiExternalUserPermission[],
        allowedServiceNames: string[] = ['*']
    ): iam.PolicyDocument {
        const enabledDevelopmentUserRole =
            service.sharedInfraClient.deploymentOptions.developmentUserRole;

        // verify the AGSRole and only allow the predfined ones
        const agsRoleNames = Object.values(AGSRole);
        const invalidAGSRoleNames: string[] = [];
        apiExternalUserPermissions.forEach((permission) => {
            permission.allowedAGSRoles.forEach((roleName) => {
                if (!agsRoleNames.includes(roleName)) {
                    invalidAGSRoleNames.push(roleName);
                }
            });
        });

        if (invalidAGSRoleNames.length > 0) {
            throw new Error(
                'Invalid AGSRole names are configured in apiExternalUserPermissions. ' +
                    `[${invalidAGSRoleNames.join(', ')}]`
            );
        }

        // generate Attribute Based Access Control statements for AGSExternalUserRole
        const externalUserStatements: iam.PolicyStatement[] = [];
        apiExternalUserPermissions.forEach((permission: AGSApiExternalUserPermission) => {
            // generate resource list of this statement
            const resources = permission.endpoints.map(
                ({ resourcePath, httpMethod }) =>
                    `execute-api:/*/${httpMethod.toUpperCase()}/${resourcePath}`
            );

            const agsRoleList = permission.allowedAGSRoles.map((roleName) =>
                roleName === AGSRole.EVERYONE ? '*' : `*${roleName}*`
            );
            agsRoleList.push(`*${AGSRole.SYSTEM_ADMIN}*`);

            // allow statement
            const allowStatement = iam.PolicyStatement.fromJson({
                Effect: iam.Effect.ALLOW,
                Principal: {
                    AWS: `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/AGSExternalUserRole`,
                },
                Action: 'execute-api:Invoke',
                Resource: resources,
                Condition: {
                    StringLike: {
                        'aws:PrincipalTag/AGSRoles': agsRoleList,
                    },
                },
            });
            externalUserStatements.push(allowStatement);

            // add deny statement if exactMatch is true
            if (permission.exactMatch) {
                const denyStatement = iam.PolicyStatement.fromJson({
                    Effect: iam.Effect.DENY,
                    Principal: {
                        AWS: `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/AGSExternalUserRole`,
                    },
                    Action: 'execute-api:Invoke',
                    Resource: resources,
                    Condition: {
                        'ForAllValues:StringNotLikeIfExists': {
                            'aws:PrincipalTag/AGSRoles': agsRoleList,
                        },
                    },
                });
                externalUserStatements.push(denyStatement);
            }
        });

        // Allow HTTP Preflight
        const preflightStatement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*/OPTIONS/*'],
        });

        // Allow other AGS Service to access this API based on Allow List of Service Name
        // add trusted developer account into allowed principal list for in development environment
        const trustedDeveloperAccounts =
            service.sharedInfraClient.trustedDeveloperAccounts;
        const principalAccounts = enabledDevelopmentUserRole
            ? [cdk.Aws.ACCOUNT_ID, ...trustedDeveloperAccounts]
            : [cdk.Aws.ACCOUNT_ID];

        const accountConditions = {
            // for any identity in AGS Service Account or Trusted Developer Account (in dev env)
            'ForAnyValue:StringEquals': {
                'aws:PrincipalAccount': principalAccounts,
            },
            // exclude AGSExternalUserRole
            StringNotLike: {
                'aws:PrincipalArn': `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/AGSExternalUserRole`,
            },
        };

        /* eslint-disable-next-line */
        let policyConditions: Record<string, any> = accountConditions;

        // not addding the ags:service tag check if it is development mode so that developer
        // can call API from any roles in trusted developer account
        if (!enabledDevelopmentUserRole) {
            policyConditions = {
                ...policyConditions,
                // and the caller Role must to have tag `ags:service` with its service name and its service name
                // must be in the allowed list for this service
                'ForAnyValue:StringLike': {
                    'aws:PrincipalTag/ags:service': allowedServiceNames,
                },
            };
        }

        const serviceUserStatement = iam.PolicyStatement.fromJson({
            Effect: iam.Effect.ALLOW,
            Principal: {
                AWS: '*',
            },
            Action: 'execute-api:Invoke',
            Resource: 'execute-api:/*/*/*',
            Condition: policyConditions,
        });

        // Allow AGSDevelopmentUserRole to access this API without restriction
        const developmentUserStatement = iam.PolicyStatement.fromJson({
            Effect: iam.Effect.ALLOW,
            Principal: {
                AWS: `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/AGSDevelopmentUserRole`,
            },
            Action: 'execute-api:Invoke',
            Resource: 'execute-api:/*/*/*',
        });

        const policyDoc = new iam.PolicyDocument();
        policyDoc.addStatements(...externalUserStatements);
        policyDoc.addStatements(serviceUserStatement);
        if (enabledDevelopmentUserRole) {
            policyDoc.addStatements(developmentUserStatement);
        }
        policyDoc.addStatements(preflightStatement);

        // custom resource policy
        if (service.sharedInfraClient.customAPIResourcePolicyJSON !== 'NONE') {
            const customResourcePolicyStatement = iam.PolicyStatement.fromJson(
                JSON.parse(service.sharedInfraClient.customAPIResourcePolicyJSON)
            );
            policyDoc.addStatements(customResourcePolicyStatement);
        }

        return policyDoc;
    }
}

function addResourceThrows(): apigateway.Resource {
    throw new Error(
        "Cannot call 'addResource' on a proxying AGSRestApi; set 'enableProxyAll' to false"
    );
}

function addMethodThrows(): apigateway.Method {
    throw new Error(
        "Cannot call 'addMethod' on a proxying AGSRestApi; set 'enableProxyAll' to false"
    );
}

function addProxyThrows(): apigateway.ProxyResource {
    throw new Error(
        "Cannot call 'addProxy' on a proxying AGSRestApi; set 'enableProxyAll' to false"
    );
}
