"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGSRestApi = void 0;
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
const cdk = require("@aws-cdk/core");
const apigateway = require("@aws-cdk/aws-apigateway");
const ssm = require("@aws-cdk/aws-ssm");
const iam = require("@aws-cdk/aws-iam");
const lambda = require("@aws-cdk/aws-lambda");
const aws_apigateway_1 = require("@aws-cdk/aws-apigateway");
const ags_aspects_1 = require("./ags-aspects");
const wafv2 = require("@aws-cdk/aws-wafv2");
const ags_types_1 = require("./ags-types");
class AGSRestApi extends cdk.Construct {
    constructor(scope, id, props) {
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
        }
        else {
            endpointConfig = {
                types: [apigateway.EndpointType.EDGE],
            };
        }
        this.versionAlias = new lambda.Alias(this, 'alias', {
            aliasName: 'prod',
            version: props.lambdaFunction.lambdaFunction.currentVersion,
        });
        const gwTarget = props.enableAlias
            ? this.versionAlias
            : props.lambdaFunction.lambdaFunction;
        this.api = new apigateway.RestApi(this, `API`, {
            description: `Rest Api for ${service.serviceName}`,
            defaultIntegration: new aws_apigateway_1.LambdaIntegration(gwTarget, {
                proxy: true,
                allowTestInvoke: props.allowTestInvoke,
            }),
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
            },
            defaultMethodOptions: {
                authorizationType: apigateway.AuthorizationType.IAM,
            },
            policy: this.composeApiResourcePolicy(service, props.apiExternalUserPermissions, props.allowedServiceNames),
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
        cdk.Aspects.of(this.api).add(new ags_aspects_1.OptionMethodNoAuth());
        // associate WAF WebACL to APIGateway if WebACL ARN is specified
        if (sharedInfraClient.apiGatewayWebAclArn.startsWith('arn:aws:wafv2', 0)) {
            const webACLAssociation = new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
                resourceArn: `arn:${cdk.Aws.PARTITION}:apigateway:${cdk.Aws.REGION}::/restapis/${this.api.restApiId}/stages/prod`,
                webAclArn: sharedInfraClient.apiGatewayWebAclArn,
            });
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
    composeApiResourcePolicy(service, apiExternalUserPermissions, allowedServiceNames = ['*']) {
        const enabledDevelopmentUserRole = service.sharedInfraClient.deploymentOptions.developmentUserRole;
        // verify the AGSRole and only allow the predfined ones
        const agsRoleNames = Object.values(ags_types_1.AGSRole);
        const invalidAGSRoleNames = [];
        apiExternalUserPermissions.forEach((permission) => {
            permission.allowedAGSRoles.forEach((roleName) => {
                if (!agsRoleNames.includes(roleName)) {
                    invalidAGSRoleNames.push(roleName);
                }
            });
        });
        if (invalidAGSRoleNames.length > 0) {
            throw new Error('Invalid AGSRole names are configured in apiExternalUserPermissions. ' +
                `[${invalidAGSRoleNames.join(', ')}]`);
        }
        // generate Attribute Based Access Control statements for AGSExternalUserRole
        const externalUserStatements = [];
        apiExternalUserPermissions.forEach((permission) => {
            // generate resource list of this statement
            const resources = permission.endpoints.map(({ resourcePath, httpMethod }) => `execute-api:/*/${httpMethod.toUpperCase()}/${resourcePath}`);
            const agsRoleList = permission.allowedAGSRoles.map((roleName) => roleName === ags_types_1.AGSRole.EVERYONE ? '*' : `*${roleName}*`);
            agsRoleList.push(`*${ags_types_1.AGSRole.SYSTEM_ADMIN}*`);
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
        const trustedDeveloperAccounts = service.sharedInfraClient.trustedDeveloperAccounts;
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
        let policyConditions = accountConditions;
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
            const customResourcePolicyStatement = iam.PolicyStatement.fromJson(JSON.parse(service.sharedInfraClient.customAPIResourcePolicyJSON));
            policyDoc.addStatements(customResourcePolicyStatement);
        }
        return policyDoc;
    }
}
exports.AGSRestApi = AGSRestApi;
function addResourceThrows() {
    throw new Error("Cannot call 'addResource' on a proxying AGSRestApi; set 'enableProxyAll' to false");
}
function addMethodThrows() {
    throw new Error("Cannot call 'addMethod' on a proxying AGSRestApi; set 'enableProxyAll' to false");
}
function addProxyThrows() {
    throw new Error("Cannot call 'addProxy' on a proxying AGSRestApi; set 'enableProxyAll' to false");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXJlc3QtYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2Fncy1yZXN0LWFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7RUFjRTtBQUNGLHFDQUFxQztBQUNyQyxzREFBc0Q7QUFDdEQsd0NBQXdDO0FBQ3hDLHdDQUF3QztBQUd4Qyw4Q0FBOEM7QUFFOUMsNERBQTREO0FBQzVELCtDQUFtRDtBQUNuRCw0Q0FBNEM7QUFDNUMsMkNBQXNDO0FBd0l0QyxNQUFhLFVBQVcsU0FBUSxHQUFHLENBQUMsU0FBUztJQUt6QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUM5QixNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztRQUNwRCxNQUFNLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDO1FBRTlELHFEQUFxRDtRQUNyRCxNQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxjQUFjLEtBQUssU0FBUyxDQUFDO1FBRXRFLDhCQUE4QjtRQUM5QixJQUFJLGNBQWMsR0FBRyxTQUFTLENBQUM7UUFDL0IsSUFBSSxjQUFjLEVBQUU7WUFDaEIsY0FBYyxHQUFHO2dCQUNiLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDO2dCQUN4QyxZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQzthQUMxRCxDQUFDO1NBQ0w7YUFBTTtZQUNILGNBQWMsR0FBRztnQkFDYixLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQzthQUN4QyxDQUFDO1NBQ0w7UUFFRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUss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QUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUM5RCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQywyQkFBMkIsQ0FBQyxDQUNwRSxDQUFDO1lBQ0YsU0FBUyxDQUFDLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1NBQzFEO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztDQUNKO0FBelJELGdDQXlSQztBQUVELFNBQVMsaUJBQWlCO0lBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQ1gsbUZBQW1GLENBQ3RGLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBUyxlQUFlO0lBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQ1gsaUZBQWlGLENBQ3BGLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBUyxjQUFjO0lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQ1gsZ0ZBQWdGLENBQ25GLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogXG4gIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICBcbiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKS5cbiAgWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgXG4gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgXG4gIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIHNzbSBmcm9tICdAYXdzLWNkay9hd3Mtc3NtJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCB7IEFHU0xhbWJkYUZ1bmN0aW9uIH0gZnJvbSAnLi9hZ3MtbGFtYmRhLWZ1bmN0aW9uJztcbmltcG9ydCB7IEFHU1NlcnZpY2UgfSBmcm9tICcuL2Fncy1zZXJ2aWNlJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcbmltcG9ydCB7IElGdW5jdGlvbiB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgTGFtYmRhSW50ZWdyYXRpb24gfSBmcm9tICdAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgeyBPcHRpb25NZXRob2ROb0F1dGggfSBmcm9tICcuL2Fncy1hc3BlY3RzJztcbmltcG9ydCAqIGFzIHdhZnYyIGZyb20gJ0Bhd3MtY2RrL2F3cy13YWZ2Mic7XG5pbXBvcnQgeyBBR1NSb2xlIH0gZnJvbSAnLi9hZ3MtdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFwaUVuZHBvaW50IHtcbiAgICByZXNvdXJjZVBhdGg6IHN0cmluZztcbiAgICBodHRwTWV0aG9kOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUdTQXBpRXh0ZXJuYWxVc2VyUGVybWlzc2lvbiB7XG4gICAgZW5kcG9pbnRzOiBBcGlFbmRwb2ludFtdO1xuICAgIGFsbG93ZWRBR1NSb2xlczogQUdTUm9sZVtdO1xuICAgIGV4YWN0TWF0Y2g/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFHU1Jlc3RBcGlQcm9wcyB7XG4gICAgLyoqXG4gICAgICogQUdTIFNlcnZpY2UgT2JqZWN0XG4gICAgICovXG4gICAgc2VydmljZTogQUdTU2VydmljZTtcbiAgICAvKipcbiAgICAgKiBBIExhbWJkYSBGdW5jdGlvbiB0byBoYW5kbGUgQVBJIFJlcXVlc3RcbiAgICAgKi9cbiAgICBsYW1iZGFGdW5jdGlvbjogQUdTTGFtYmRhRnVuY3Rpb247XG4gICAgLyoqXG4gICAgICogQSBsaXN0IG9mIHBlcm1pc3Npb25zIGZvciBBR1MgRXh0ZXJuYWwgVXNlcnNcbiAgICAgKlxuICAgICAqIEFHUyBFeHRlcm5hbCBVc2VyIGNhbiBiZSBncmFudGVkIHBlcm1pc3Npb24gb24gZWFjaCBpbmRpdmlkdWFsIEFQSSBlbmRwb2ludCAocmVzb3VyY2UgYW5kIG1ldGhvZCkuXG4gICAgICogVGhlIHBlcm1pc3Npb24gaXMgZ3JhbnRlZCBieSBtYXRjaGluZyB0aGUgQUdTUm9sZSBuYW1lcyB0aGF0IGFyZSBzcGVjaWZpZWQgaW4gdGhlIHVzZXIgcHJvZmlsZSBhZ2FpbnN0XG4gICAgICogdGhlIGFsbG93ZWRBR1NSb2xlcyBzcGVjaWZpZWQgaW4gYXBpRXh0ZXJuYWxVc2VyUGVybWlzc2lvbnNcbiAgICAgKlxuICAgICAqIE11bHRpcGxlIEFQSSBlbmRwb2ludHMgY2FuIGJlIHNwZWNpZmllZCBpbiBvbmUgQUdTQXBpRXh0ZXJuYWxVc2VyUGVybWlzc2lvbiBhbmQgYWxzbyBtdWx0aXBsZSBBR1MgUm9sZXMuXG4gICAgICogVGhlIHVzZXIgd2lsbCBiZSBhbGxvd2VkIHRvIGFjY2VzcyBhbGwgQVBJIGVuZHBvaW50cyBsaXN0ZWQgaW4gdGhlIEFHU0FwaUV4dGVybmFsVXNlclBlcm1pc3Npb25hcyBsb25nIGFzXG4gICAgICogdGhlIHVzZXIgaGFzIGFueSBvZiB0aGUgc3BlY2lmaWVkIGFsbG93ZWQgQUdTIFJvbGVzIGluIHRoZSB1c2VyIHByb2ZpbGUuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqICAgQWxsb3cgRG9tYWluT3duZXIgb3IgTGluZTFSaXNrIHRvIGFjY2VzcyBMaXN0IGFuZCBHZXREZXRhaWxzIEFQSSBlbmRwb2ludHMuXG4gICAgICogICBbXG4gICAgICogICAgICAge1xuICAgICAqICAgICAgICAgICBlbmRwb2ludHM6IFtcbiAgICAgKiAgICAgICAgICAgICAgIHtcbiAgICAgKiAgICAgICAgICAgICAgICAgICByZXNvdXJjZVBhdGg6ICdjb250cm9sb2JqZWN0aXZlcycsXG4gICAgICogICAgICAgICAgICAgICAgICAgaHR0cE1ldGhvZDogJ0dFVCcsXG4gICAgICogICAgICAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgICAgICAge1xuICAgICAqICAgICAgICAgICAgICAgICAgIHJlc291cmNlUGF0aDogJ2NvbnRyb2xvYmplY3RpdmVzLyonLFxuICAgICAqICAgICAgICAgICAgICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxuICAgICAqICAgICAgICAgICAgICAgfSxcbiAgICAgKiAgICAgICAgICAgXSxcbiAgICAgKiAgICAgICAgICAgYWxsb3dlZEFHU1JvbGVzOiBbQUdTUm9sZS5ET01BSU5fT1dORVIsIEFHU1JvbGUuTElORV9PTkVfUklTS10sXG4gICAgICogICAgICAgfSxcbiAgICAgKiAgIF07XG4gICAgICpcbiAgICAgKiAgIFVzZSBleGFjdE1hdGNoIGlmIHRoZXJlIGlzIG92ZXJsYXBwZWQgcmVzb3VyY2UgcGF0aC4gVGhpcyBleGFtcGxlIGJlbG93IG9ubHkgYWxsb3cgYENoaWVmUmlza09mZmljZWBcbiAgICAgKiAgIHRvIGFjY2VzcyBgUFVUIC9idXNpbmVzc3VuaXRzL2VudGVycHJpc2VgLCBldmVuIERvbWFpbk93bmVyIGlzIGFsbG93ZWQgdG8gYWNjZXNzIGBQVVQgL2J1c2luZXNzdW5pdHMvKmBcbiAgICAgKiAgIFtcbiAgICAgKiAgICAgICB7XG4gICAgICogICAgICAgICAgIGVuZHBvaW50czogW1xuICAgICAqICAgICAgICAgICAgICAge1xuICAgICAqICAgICAgICAgICAgICAgICAgIHJlc291cmNlUGF0aDogJ2J1c2luZXNzdW5pdHMvZW50ZXJwcmlzZScsXG4gICAgICogICAgICAgICAgICAgICAgICAgaHR0cE1ldGhvZDogJ1BVVCcsXG4gICAgICogICAgICAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgICBdLFxuICAgICAqICAgICAgICAgICBhbGxvd2VkQUdTUm9sZXM6IFtBR1NSb2xlLkNISUVGX1JJU0tfT0ZGSUNFXSxcbiAgICAgKiAgICAgICAgICAgZXhhY3RNYXRjaDogdHJ1ZSxcbiAgICAgKiAgICAgICB9LFxuICAgICAqICAgICAgIHtcbiAgICAgKiAgICAgICAgICAgZW5kcG9pbnRzOiBbXG4gICAgICogICAgICAgICAgICAgICB7XG4gICAgICogICAgICAgICAgICAgICAgICAgcmVzb3VyY2VQYXRoOiAnYnVzaW5lc3N1bml0cy8qJyxcbiAgICAgKiAgICAgICAgICAgICAgICAgICBodHRwTWV0aG9kOiAnUFVUJyxcbiAgICAgKiAgICAgICAgICAgICAgIH0sXG4gICAgICogICAgICAgICAgIF0sXG4gICAgICogICAgICAgICAgIGFsbG93ZWRBR1NSb2xlczogW0FHU1JvbGUuRE9NQUlOX09XTkVSXSxcbiAgICAgKiAgICAgICB9LFxuICAgICAqICAgXTtcbiAgICAgKlxuICAgICAqXG4gICAgICogICBBbGxvdyBldmVyeW9uZSB0byBhY2Nlc3MgYWxsIEFQSSBlbmRwb2ludHMgKE5vIFJlc3RyaWN0aW9uKVxuICAgICAqICAgW1xuICAgICAqICAgICAgIHtcbiAgICAgKiAgICAgICAgICAgZW5kcG9pbnRzOiBbXG4gICAgICogICAgICAgICAgICAgICB7XG4gICAgICogICAgICAgICAgICAgICAgICAgcmVzb3VyY2VQYXRoOiAnKicsXG4gICAgICogICAgICAgICAgICAgICAgICAgaHR0cE1ldGhvZDogJyonLFxuICAgICAqICAgICAgICAgICAgICAgfSxcbiAgICAgKiAgICAgICAgICAgXSxcbiAgICAgKiAgICAgICAgICAgYWxsb3dlZEFHU1JvbGVzOiBbQUdTUm9sZS5FVkVSWU9ORV0sXG4gICAgICogICAgICAgfSxcbiAgICAgKiAgIF07XG4gICAgICovXG4gICAgYXBpRXh0ZXJuYWxVc2VyUGVybWlzc2lvbnM6IEFHU0FwaUV4dGVybmFsVXNlclBlcm1pc3Npb25bXTtcbiAgICAvKipcbiAgICAgKiBBIGxpc3Qgb2YgQUdTIFNlcnZpY2UgTmFtZXMgdGhhdCBhbGxvdyBhY2Nlc3MgdG8gdGhpcyBBUEkuXG4gICAgICpcbiAgICAgKiBUaGlzIGlzIHRvIGNvbnRyb2wgd2hpY2ggQUdTIFNlcnZpY2UgY2FuIGFjY2VzcyB0byB0aGlzIEFQSS5cbiAgICAgKlxuICAgICAqIFZhbGlkIHZhbHVlIGlzIGAvXihbYS16QS1aMC05XFwtX10qfFxcKikkL2AuIEVpdGhlciBhIG5hbWUgbWFkZSBvZiB1cHBlci9sb3dlciBjYXNlIGxldHRlcnMsIGh5cGVuLFxuICAgICAqIHVuZGVyc2NvcmUsIG9yIGEgc2luZ2xlIGFzdHJlcm9pZCAoKikgdG8gYWxsb3cgQUxMLlxuICAgICAqXG4gICAgICogQGRlZmF1bHQgKiAtIGFsbG93IEFMTCBhY2Nlc3NcbiAgICAgKi9cbiAgICBhbGxvd2VkU2VydmljZU5hbWVzPzogc3RyaW5nW107XG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBJbmRpY2F0ZSB3aGV0aGVyIG9yIG5vdCBwcm94eSBhbGwgcmVxdWVzdHMgdG8gdGhlIGRlZmF1bHQgbGFtYmRhIGhhbmRsZXJcbiAgICAgKlxuICAgICAqIElmIHRydWUsIHJvdXRlIGFsbCByZXF1ZXN0cyB0byB0aGUgTGFtYmRhIEZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogSWYgc2V0IHRvIGZhbHNlLCB5b3Ugd2lsbCBuZWVkIHRvIGV4cGxpY2l0bHkgZGVmaW5lIHRoZSBBUEkgbW9kZWwgdXNpbmdcbiAgICAgKiBgYWRkUmVzb3VyY2VgIGFuZCBgYWRkTWV0aG9kYCAob3IgYGFkZFByb3h5YCkuXG4gICAgICpcbiAgICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgICovXG4gICAgZW5hYmxlUHJveHlBbGw/OiBib29sZWFuO1xuICAgIC8qKlxuICAgICAqXG4gICAgICogSW5kaWNhdGUgd2hldGhlciBvciBub3QgdXNlIGxhbWJkYSBhbGlhc1xuICAgICAqXG4gICAgICogSWYgdHJ1ZSwgY3JlYXRlIGxhbWJkYSBhbGlhcyBhcyBBUEkgZ2F0ZXdheSB0YXJnZXRcbiAgICAgKlxuICAgICAqXG4gICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgKi9cbiAgICBlbmFibGVBbGlhcz86IGJvb2xlYW47XG4gICAgLyoqXG4gICAgICogQWxsb3cgaW52b2tpbmcgbWV0aG9kIGZyb20gQVdTIENvbnNvbGUgVUkgKGZvciB0ZXN0aW5nIHB1cnBvc2VzKS5cbiAgICAgKlxuICAgICAqIFRoaXMgd2lsbCBhZGQgYW5vdGhlciBwZXJtaXNzaW9uIHRvIHRoZSBBV1MgTGFtYmRhIHJlc291cmNlIHBvbGljeSB3aGljaFxuICAgICAqIHdpbGwgYWxsb3cgdGhlIGB0ZXN0LWludm9rZS1zdGFnZWAgc3RhZ2UgdG8gaW52b2tlIHRoaXMgaGFuZGxlci4gSWYgdGhpc1xuICAgICAqIGlzIHNldCB0byBgZmFsc2VgLCB0aGUgZnVuY3Rpb24gd2lsbCBvbmx5IGJlIHVzYWJsZSBmcm9tIHRoZSBkZXBsb3ltZW50XG4gICAgICogZW5kcG9pbnQuXG4gICAgICpcbiAgICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgICovXG4gICAgYWxsb3dUZXN0SW52b2tlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEFHU1Jlc3RBcGkgZXh0ZW5kcyBjZGsuQ29uc3RydWN0IHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LkxhbWJkYVJlc3RBcGk7XG4gICAgcHVibGljIHJlYWRvbmx5IHZlcnNpb25BbGlhczogbGFtYmRhLkFsaWFzO1xuICAgIHB1YmxpYyByZWFkb25seSBhcGlVcmw6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQUdTUmVzdEFwaVByb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAgICAgY29uc3Qgc2VydmljZSA9IHByb3BzLnNlcnZpY2U7XG4gICAgICAgIGNvbnN0IHNoYXJlZEluZnJhQ2xpZW50ID0gc2VydmljZS5zaGFyZWRJbmZyYUNsaWVudDtcbiAgICAgICAgY29uc3QgZGVwbG95bWVudE9wdGlvbnMgPSBzaGFyZWRJbmZyYUNsaWVudC5kZXBsb3ltZW50T3B0aW9ucztcblxuICAgICAgICAvLyBDaGVjayBBcGlHYXRld2F5IHR5cGUgdG8gZGVjaWRlIGlmIHVzZSBWcGNFbmRwb2ludFxuICAgICAgICBjb25zdCB1c2VWcGNFbmRwb2ludCA9IGRlcGxveW1lbnRPcHRpb25zLmFwaUdhdGV3YXlUeXBlID09PSAncHJpdmF0ZSc7XG5cbiAgICAgICAgLy8gY29tcG9zZSBWcGNFbmRwb2ludCBzZXR0aW5nXG4gICAgICAgIGxldCBlbmRwb2ludENvbmZpZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHVzZVZwY0VuZHBvaW50KSB7XG4gICAgICAgICAgICBlbmRwb2ludENvbmZpZyA9IHtcbiAgICAgICAgICAgICAgICB0eXBlczogW2FwaWdhdGV3YXkuRW5kcG9pbnRUeXBlLlBSSVZBVEVdLFxuICAgICAgICAgICAgICAgIHZwY0VuZHBvaW50czogW3NoYXJlZEluZnJhQ2xpZW50LmFwaWdhdGV3YXlWcGNFbmRwb2ludF0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW5kcG9pbnRDb25maWcgPSB7XG4gICAgICAgICAgICAgICAgdHlwZXM6IFthcGlnYXRld2F5LkVuZHBvaW50VHlwZS5FREdFXSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnZlcnNpb25BbGlhcyA9IG5ldyBsYW1iZGEuQWxpYXModGhpcywgJ2FsaWFzJywge1xuICAgICAgICAgICAgYWxpYXNOYW1lOiAncHJvZCcsXG4gICAgICAgICAgICB2ZXJzaW9uOiBwcm9wcy5sYW1iZGFGdW5jdGlvbi5sYW1iZGFGdW5jdGlvbi5jdXJyZW50VmVyc2lvbixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZ3dUYXJnZXQ6IElGdW5jdGlvbiA9IHByb3BzLmVuYWJsZUFsaWFzXG4gICAgICAgICAgICA/IHRoaXMudmVyc2lvbkFsaWFzXG4gICAgICAgICAgICA6IHByb3BzLmxhbWJkYUZ1bmN0aW9uLmxhbWJkYUZ1bmN0aW9uO1xuXG4gICAgICAgIHRoaXMuYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCBgQVBJYCwge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IGBSZXN0IEFwaSBmb3IgJHtzZXJ2aWNlLnNlcnZpY2VOYW1lfWAsXG4gICAgICAgICAgICBkZWZhdWx0SW50ZWdyYXRpb246IG5ldyBMYW1iZGFJbnRlZ3JhdGlvbihnd1RhcmdldCwge1xuICAgICAgICAgICAgICAgIHByb3h5OiB0cnVlLCAvL2xhbWJkYSBwcm94eSBzaG91bGQgYmUgYWx3YXlzIG9uXG4gICAgICAgICAgICAgICAgYWxsb3dUZXN0SW52b2tlOiBwcm9wcy5hbGxvd1Rlc3RJbnZva2UsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlZmF1bHRNZXRob2RPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuSUFNLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvbGljeTogdGhpcy5jb21wb3NlQXBpUmVzb3VyY2VQb2xpY3koXG4gICAgICAgICAgICAgICAgc2VydmljZSxcbiAgICAgICAgICAgICAgICBwcm9wcy5hcGlFeHRlcm5hbFVzZXJQZXJtaXNzaW9ucyxcbiAgICAgICAgICAgICAgICBwcm9wcy5hbGxvd2VkU2VydmljZU5hbWVzXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgZW5kcG9pbnRDb25maWd1cmF0aW9uOiBlbmRwb2ludENvbmZpZyxcbiAgICAgICAgICAgIGRlcGxveU9wdGlvbnM6IHsgbWV0cmljc0VuYWJsZWQ6IHRydWUsIHRyYWNpbmdFbmFibGVkOiB0cnVlIH0sXG4gICAgICAgICAgICByZXN0QXBpTmFtZTogYCR7c2VydmljZS5zZXJ2aWNlTmFtZX0tQVBJYCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gYWRkIENPUlMgaGVhZGVyIHRvIEFQSUdhdGV3YXkgRGVmYXVsdCA0eHggYW5kIDV4eCByZXNwb25zZXNcbiAgICAgICAgLy8gc28gdGhhdCBicm93c2VyIGNhbiByZWNlaXZlIHRoZSBzdGF0dXMgY29kZSBhbmQgZXJyb3IgbWVzc2FnZVxuICAgICAgICB0aGlzLmFwaS5hZGRHYXRld2F5UmVzcG9uc2UoJ2RlZmF1bHQtNHh4Jywge1xuICAgICAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5SZXNwb25zZVR5cGUuREVGQVVMVF80WFgsXG4gICAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnYWNjZXNzLWNvbnRyb2wtYWxsb3ctb3JpZ2luJzogYCcqJ2AsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFwaS5hZGRHYXRld2F5UmVzcG9uc2UoJ2RlZmF1bHQtNXh4Jywge1xuICAgICAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5SZXNwb25zZVR5cGUuREVGQVVMVF81WFgsXG4gICAgICAgICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnYWNjZXNzLWNvbnRyb2wtYWxsb3ctb3JpZ2luJzogYCcqJ2AsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocHJvcHMuZW5hYmxlUHJveHlBbGwgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLmFwaS5yb290LmFkZFByb3h5KCk7XG5cbiAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB1c2VycyBjYW5ub3QgY2FsbCBhbnkgb3RoZXIgcmVzb3VyY2UgYWRkaW5nIGZ1bmN0aW9uXG4gICAgICAgICAgICB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlID0gYWRkUmVzb3VyY2VUaHJvd3M7XG4gICAgICAgICAgICB0aGlzLmFwaS5yb290LmFkZE1ldGhvZCA9IGFkZE1ldGhvZFRocm93cztcbiAgICAgICAgICAgIHRoaXMuYXBpLnJvb3QuYWRkUHJveHkgPSBhZGRQcm94eVRocm93cztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCBPUFRJT05TIG1ldGhvZCB3aXRoIE5PTkUgYXV0aGVudGljYXRpb24gZm9yIGJyb3dzZXIgdG8gYWNjZXNzLlxuICAgICAgICAvLyBCYXNlZCBvbiBXMyBzcGVjLCBDT1JTLXByZWZsaWdodCByZXF1ZXN0IG5ldmVyIGluY2x1ZGVzIGNyZWRlbnRpYWxzLlxuICAgICAgICAvLyBodHRwczovL2ZldGNoLnNwZWMud2hhdHdnLm9yZy8jY29ycy1wcm90b2NvbC1hbmQtY3JlZGVudGlhbHNcbiAgICAgICAgY2RrLkFzcGVjdHMub2YodGhpcy5hcGkpLmFkZChuZXcgT3B0aW9uTWV0aG9kTm9BdXRoKCkpO1xuXG4gICAgICAgIC8vIGFzc29jaWF0ZSBXQUYgV2ViQUNMIHRvIEFQSUdhdGV3YXkgaWYgV2ViQUNMIEFSTiBpcyBzcGVjaWZpZWRcbiAgICAgICAgaWYgKHNoYXJlZEluZnJhQ2xpZW50LmFwaUdhdGV3YXlXZWJBY2xBcm4uc3RhcnRzV2l0aCgnYXJuOmF3czp3YWZ2MicsIDApKSB7XG4gICAgICAgICAgICBjb25zdCB3ZWJBQ0xBc3NvY2lhdGlvbiA9IG5ldyB3YWZ2Mi5DZm5XZWJBQ0xBc3NvY2lhdGlvbihcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgICdXZWJBQ0xBc3NvY2lhdGlvbicsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZUFybjogYGFybjoke2Nkay5Bd3MuUEFSVElUSU9OfTphcGlnYXRld2F5OiR7Y2RrLkF3cy5SRUdJT059OjovcmVzdGFwaXMvJHt0aGlzLmFwaS5yZXN0QXBpSWR9L3N0YWdlcy9wcm9kYCxcbiAgICAgICAgICAgICAgICAgICAgd2ViQWNsQXJuOiBzaGFyZWRJbmZyYUNsaWVudC5hcGlHYXRld2F5V2ViQWNsQXJuLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB3ZWJBQ0xBc3NvY2lhdGlvbi5ub2RlLmFkZERlcGVuZGVuY3kodGhpcy5hcGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3NtIHBhcmFtZXRlciBmb3IgQXBpR2F0ZXdheSBFbmRwb2ludCBVUkxcbiAgICAgICAgdGhpcy5hcGlVcmwgPSB1c2VWcGNFbmRwb2ludFxuICAgICAgICAgICAgPyBgaHR0cHM6Ly8ke3RoaXMuYXBpLnJlc3RBcGlJZH0tJHtzaGFyZWRJbmZyYUNsaWVudC5hcGlnYXRld2F5VnBjRW5kcG9pbnQudnBjRW5kcG9pbnRJZH0uZXhlY3V0ZS1hcGkuJHtjZGsuQXdzLlJFR0lPTn0uJHtjZGsuQXdzLlVSTF9TVUZGSVh9LyR7dGhpcy5hcGkuZGVwbG95bWVudFN0YWdlLnN0YWdlTmFtZX0vYFxuICAgICAgICAgICAgOiB0aGlzLmFwaS51cmw7XG5cbiAgICAgICAgbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIodGhpcywgJ0FwaVVybCcsIHtcbiAgICAgICAgICAgIHBhcmFtZXRlck5hbWU6IGAvYWdzL2VuZHBvaW50cy8ke3NlcnZpY2Uuc2VydmljZU5hbWV9YCxcbiAgICAgICAgICAgIHN0cmluZ1ZhbHVlOiB0aGlzLmFwaVVybCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIodGhpcywgJ0FwaUhvc3QnLCB7XG4gICAgICAgICAgICBwYXJhbWV0ZXJOYW1lOiBgL2Fncy9ob3N0bmFtZXMvJHtzZXJ2aWNlLnNlcnZpY2VOYW1lfWAsXG4gICAgICAgICAgICBzdHJpbmdWYWx1ZTogYCR7dGhpcy5hcGkucmVzdEFwaUlkfS5leGVjdXRlLWFwaS4ke2Nkay5Bd3MuUkVHSU9OfS4ke2Nkay5Bd3MuVVJMX1NVRkZJWH1gLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjaGVjayBBcGlHYXRld2F5IHR5cGUgdG8gZGVjaWRlIGlmIGFkZGVkIGl0IHRvIENsb3VkRnJvbnRcbiAgICAgICAgaWYgKGRlcGxveW1lbnRPcHRpb25zLmFwaUdhdGV3YXlUeXBlID09PSAnY2xvdWRmcm9udCcpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFVzZSBEaXN0cmlidXRpb25PcmlnaW5BdHRhY2htZW50IGN1c3RvbSByZXNvdXJjZSBpbiBTaGFyZWQgSW5mcmFcbiAgICAgICAgICAgIC8vIHRvIGFkZCB0aGUgQVBJR2F0ZXdheSBhcyBDdXN0b21PcmlnaW4gdG8gdGhlIENsb3VkRnJvbnQgZGlzdHJpYnV0aW9uXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQVBJR2F0ZXdheSBUeXBlIGNsb3VkZnJvbnQgaXMgbm90IHN1cHBvcnQgeWV0Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGNvbXBvc2VBcGlSZXNvdXJjZVBvbGljeShcbiAgICAgICAgc2VydmljZTogQUdTU2VydmljZSxcbiAgICAgICAgYXBpRXh0ZXJuYWxVc2VyUGVybWlzc2lvbnM6IEFHU0FwaUV4dGVybmFsVXNlclBlcm1pc3Npb25bXSxcbiAgICAgICAgYWxsb3dlZFNlcnZpY2VOYW1lczogc3RyaW5nW10gPSBbJyonXVxuICAgICk6IGlhbS5Qb2xpY3lEb2N1bWVudCB7XG4gICAgICAgIGNvbnN0IGVuYWJsZWREZXZlbG9wbWVudFVzZXJSb2xlID1cbiAgICAgICAgICAgIHNlcnZpY2Uuc2hhcmVkSW5mcmFDbGllbnQuZGVwbG95bWVudE9wdGlvbnMuZGV2ZWxvcG1lbnRVc2VyUm9sZTtcblxuICAgICAgICAvLyB2ZXJpZnkgdGhlIEFHU1JvbGUgYW5kIG9ubHkgYWxsb3cgdGhlIHByZWRmaW5lZCBvbmVzXG4gICAgICAgIGNvbnN0IGFnc1JvbGVOYW1lcyA9IE9iamVjdC52YWx1ZXMoQUdTUm9sZSk7XG4gICAgICAgIGNvbnN0IGludmFsaWRBR1NSb2xlTmFtZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGFwaUV4dGVybmFsVXNlclBlcm1pc3Npb25zLmZvckVhY2goKHBlcm1pc3Npb24pID0+IHtcbiAgICAgICAgICAgIHBlcm1pc3Npb24uYWxsb3dlZEFHU1JvbGVzLmZvckVhY2goKHJvbGVOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFhZ3NSb2xlTmFtZXMuaW5jbHVkZXMocm9sZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGludmFsaWRBR1NSb2xlTmFtZXMucHVzaChyb2xlTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChpbnZhbGlkQUdTUm9sZU5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAnSW52YWxpZCBBR1NSb2xlIG5hbWVzIGFyZSBjb25maWd1cmVkIGluIGFwaUV4dGVybmFsVXNlclBlcm1pc3Npb25zLiAnICtcbiAgICAgICAgICAgICAgICAgICAgYFske2ludmFsaWRBR1NSb2xlTmFtZXMuam9pbignLCAnKX1dYFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdlbmVyYXRlIEF0dHJpYnV0ZSBCYXNlZCBBY2Nlc3MgQ29udHJvbCBzdGF0ZW1lbnRzIGZvciBBR1NFeHRlcm5hbFVzZXJSb2xlXG4gICAgICAgIGNvbnN0IGV4dGVybmFsVXNlclN0YXRlbWVudHM6IGlhbS5Qb2xpY3lTdGF0ZW1lbnRbXSA9IFtdO1xuICAgICAgICBhcGlFeHRlcm5hbFVzZXJQZXJtaXNzaW9ucy5mb3JFYWNoKChwZXJtaXNzaW9uOiBBR1NBcGlFeHRlcm5hbFVzZXJQZXJtaXNzaW9uKSA9PiB7XG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSByZXNvdXJjZSBsaXN0IG9mIHRoaXMgc3RhdGVtZW50XG4gICAgICAgICAgICBjb25zdCByZXNvdXJjZXMgPSBwZXJtaXNzaW9uLmVuZHBvaW50cy5tYXAoXG4gICAgICAgICAgICAgICAgKHsgcmVzb3VyY2VQYXRoLCBodHRwTWV0aG9kIH0pID0+XG4gICAgICAgICAgICAgICAgICAgIGBleGVjdXRlLWFwaTovKi8ke2h0dHBNZXRob2QudG9VcHBlckNhc2UoKX0vJHtyZXNvdXJjZVBhdGh9YFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3QgYWdzUm9sZUxpc3QgPSBwZXJtaXNzaW9uLmFsbG93ZWRBR1NSb2xlcy5tYXAoKHJvbGVOYW1lKSA9PlxuICAgICAgICAgICAgICAgIHJvbGVOYW1lID09PSBBR1NSb2xlLkVWRVJZT05FID8gJyonIDogYCoke3JvbGVOYW1lfSpgXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYWdzUm9sZUxpc3QucHVzaChgKiR7QUdTUm9sZS5TWVNURU1fQURNSU59KmApO1xuXG4gICAgICAgICAgICAvLyBhbGxvdyBzdGF0ZW1lbnRcbiAgICAgICAgICAgIGNvbnN0IGFsbG93U3RhdGVtZW50ID0gaWFtLlBvbGljeVN0YXRlbWVudC5mcm9tSnNvbih7XG4gICAgICAgICAgICAgICAgRWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgICBBV1M6IGBhcm46YXdzOmlhbTo6JHtjZGsuQXdzLkFDQ09VTlRfSUR9OnJvbGUvQUdTRXh0ZXJuYWxVc2VyUm9sZWAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBBY3Rpb246ICdleGVjdXRlLWFwaTpJbnZva2UnLFxuICAgICAgICAgICAgICAgIFJlc291cmNlOiByZXNvdXJjZXMsXG4gICAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIFN0cmluZ0xpa2U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhd3M6UHJpbmNpcGFsVGFnL0FHU1JvbGVzJzogYWdzUm9sZUxpc3QsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZXh0ZXJuYWxVc2VyU3RhdGVtZW50cy5wdXNoKGFsbG93U3RhdGVtZW50KTtcblxuICAgICAgICAgICAgLy8gYWRkIGRlbnkgc3RhdGVtZW50IGlmIGV4YWN0TWF0Y2ggaXMgdHJ1ZVxuICAgICAgICAgICAgaWYgKHBlcm1pc3Npb24uZXhhY3RNYXRjaCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbnlTdGF0ZW1lbnQgPSBpYW0uUG9saWN5U3RhdGVtZW50LmZyb21Kc29uKHtcbiAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBpYW0uRWZmZWN0LkRFTlksXG4gICAgICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7Y2RrLkF3cy5BQ0NPVU5UX0lEfTpyb2xlL0FHU0V4dGVybmFsVXNlclJvbGVgLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246ICdleGVjdXRlLWFwaTpJbnZva2UnLFxuICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogcmVzb3VyY2VzLFxuICAgICAgICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdGb3JBbGxWYWx1ZXM6U3RyaW5nTm90TGlrZUlmRXhpc3RzJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhd3M6UHJpbmNpcGFsVGFnL0FHU1JvbGVzJzogYWdzUm9sZUxpc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGV4dGVybmFsVXNlclN0YXRlbWVudHMucHVzaChkZW55U3RhdGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWxsb3cgSFRUUCBQcmVmbGlnaHRcbiAgICAgICAgY29uc3QgcHJlZmxpZ2h0U3RhdGVtZW50ID0gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uQW55UHJpbmNpcGFsKCldLFxuICAgICAgICAgICAgYWN0aW9uczogWydleGVjdXRlLWFwaTpJbnZva2UnXSxcbiAgICAgICAgICAgIHJlc291cmNlczogWydleGVjdXRlLWFwaTovKi9PUFRJT05TLyonXSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWxsb3cgb3RoZXIgQUdTIFNlcnZpY2UgdG8gYWNjZXNzIHRoaXMgQVBJIGJhc2VkIG9uIEFsbG93IExpc3Qgb2YgU2VydmljZSBOYW1lXG4gICAgICAgIC8vIGFkZCB0cnVzdGVkIGRldmVsb3BlciBhY2NvdW50IGludG8gYWxsb3dlZCBwcmluY2lwYWwgbGlzdCBmb3IgaW4gZGV2ZWxvcG1lbnQgZW52aXJvbm1lbnRcbiAgICAgICAgY29uc3QgdHJ1c3RlZERldmVsb3BlckFjY291bnRzID1cbiAgICAgICAgICAgIHNlcnZpY2Uuc2hhcmVkSW5mcmFDbGllbnQudHJ1c3RlZERldmVsb3BlckFjY291bnRzO1xuICAgICAgICBjb25zdCBwcmluY2lwYWxBY2NvdW50cyA9IGVuYWJsZWREZXZlbG9wbWVudFVzZXJSb2xlXG4gICAgICAgICAgICA/IFtjZGsuQXdzLkFDQ09VTlRfSUQsIC4uLnRydXN0ZWREZXZlbG9wZXJBY2NvdW50c11cbiAgICAgICAgICAgIDogW2Nkay5Bd3MuQUNDT1VOVF9JRF07XG5cbiAgICAgICAgY29uc3QgYWNjb3VudENvbmRpdGlvbnMgPSB7XG4gICAgICAgICAgICAvLyBmb3IgYW55IGlkZW50aXR5IGluIEFHUyBTZXJ2aWNlIEFjY291bnQgb3IgVHJ1c3RlZCBEZXZlbG9wZXIgQWNjb3VudCAoaW4gZGV2IGVudilcbiAgICAgICAgICAgICdGb3JBbnlWYWx1ZTpTdHJpbmdFcXVhbHMnOiB7XG4gICAgICAgICAgICAgICAgJ2F3czpQcmluY2lwYWxBY2NvdW50JzogcHJpbmNpcGFsQWNjb3VudHMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gZXhjbHVkZSBBR1NFeHRlcm5hbFVzZXJSb2xlXG4gICAgICAgICAgICBTdHJpbmdOb3RMaWtlOiB7XG4gICAgICAgICAgICAgICAgJ2F3czpQcmluY2lwYWxBcm4nOiBgYXJuOmF3czppYW06OiR7Y2RrLkF3cy5BQ0NPVU5UX0lEfTpyb2xlL0FHU0V4dGVybmFsVXNlclJvbGVgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcblxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgKi9cbiAgICAgICAgbGV0IHBvbGljeUNvbmRpdGlvbnM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSBhY2NvdW50Q29uZGl0aW9ucztcblxuICAgICAgICAvLyBub3QgYWRkZGluZyB0aGUgYWdzOnNlcnZpY2UgdGFnIGNoZWNrIGlmIGl0IGlzIGRldmVsb3BtZW50IG1vZGUgc28gdGhhdCBkZXZlbG9wZXJcbiAgICAgICAgLy8gY2FuIGNhbGwgQVBJIGZyb20gYW55IHJvbGVzIGluIHRydXN0ZWQgZGV2ZWxvcGVyIGFjY291bnRcbiAgICAgICAgaWYgKCFlbmFibGVkRGV2ZWxvcG1lbnRVc2VyUm9sZSkge1xuICAgICAgICAgICAgcG9saWN5Q29uZGl0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAuLi5wb2xpY3lDb25kaXRpb25zLFxuICAgICAgICAgICAgICAgIC8vIGFuZCB0aGUgY2FsbGVyIFJvbGUgbXVzdCB0byBoYXZlIHRhZyBgYWdzOnNlcnZpY2VgIHdpdGggaXRzIHNlcnZpY2UgbmFtZSBhbmQgaXRzIHNlcnZpY2UgbmFtZVxuICAgICAgICAgICAgICAgIC8vIG11c3QgYmUgaW4gdGhlIGFsbG93ZWQgbGlzdCBmb3IgdGhpcyBzZXJ2aWNlXG4gICAgICAgICAgICAgICAgJ0ZvckFueVZhbHVlOlN0cmluZ0xpa2UnOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6UHJpbmNpcGFsVGFnL2FnczpzZXJ2aWNlJzogYWxsb3dlZFNlcnZpY2VOYW1lcyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlcnZpY2VVc2VyU3RhdGVtZW50ID0gaWFtLlBvbGljeVN0YXRlbWVudC5mcm9tSnNvbih7XG4gICAgICAgICAgICBFZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBBV1M6ICcqJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBBY3Rpb246ICdleGVjdXRlLWFwaTpJbnZva2UnLFxuICAgICAgICAgICAgUmVzb3VyY2U6ICdleGVjdXRlLWFwaTovKi8qLyonLFxuICAgICAgICAgICAgQ29uZGl0aW9uOiBwb2xpY3lDb25kaXRpb25zLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbGxvdyBBR1NEZXZlbG9wbWVudFVzZXJSb2xlIHRvIGFjY2VzcyB0aGlzIEFQSSB3aXRob3V0IHJlc3RyaWN0aW9uXG4gICAgICAgIGNvbnN0IGRldmVsb3BtZW50VXNlclN0YXRlbWVudCA9IGlhbS5Qb2xpY3lTdGF0ZW1lbnQuZnJvbUpzb24oe1xuICAgICAgICAgICAgRWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7Y2RrLkF3cy5BQ0NPVU5UX0lEfTpyb2xlL0FHU0RldmVsb3BtZW50VXNlclJvbGVgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEFjdGlvbjogJ2V4ZWN1dGUtYXBpOkludm9rZScsXG4gICAgICAgICAgICBSZXNvdXJjZTogJ2V4ZWN1dGUtYXBpOi8qLyovKicsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHBvbGljeURvYyA9IG5ldyBpYW0uUG9saWN5RG9jdW1lbnQoKTtcbiAgICAgICAgcG9saWN5RG9jLmFkZFN0YXRlbWVudHMoLi4uZXh0ZXJuYWxVc2VyU3RhdGVtZW50cyk7XG4gICAgICAgIHBvbGljeURvYy5hZGRTdGF0ZW1lbnRzKHNlcnZpY2VVc2VyU3RhdGVtZW50KTtcbiAgICAgICAgaWYgKGVuYWJsZWREZXZlbG9wbWVudFVzZXJSb2xlKSB7XG4gICAgICAgICAgICBwb2xpY3lEb2MuYWRkU3RhdGVtZW50cyhkZXZlbG9wbWVudFVzZXJTdGF0ZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHBvbGljeURvYy5hZGRTdGF0ZW1lbnRzKHByZWZsaWdodFN0YXRlbWVudCk7XG5cbiAgICAgICAgLy8gY3VzdG9tIHJlc291cmNlIHBvbGljeVxuICAgICAgICBpZiAoc2VydmljZS5zaGFyZWRJbmZyYUNsaWVudC5jdXN0b21BUElSZXNvdXJjZVBvbGljeUpTT04gIT09ICdOT05FJykge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tUmVzb3VyY2VQb2xpY3lTdGF0ZW1lbnQgPSBpYW0uUG9saWN5U3RhdGVtZW50LmZyb21Kc29uKFxuICAgICAgICAgICAgICAgIEpTT04ucGFyc2Uoc2VydmljZS5zaGFyZWRJbmZyYUNsaWVudC5jdXN0b21BUElSZXNvdXJjZVBvbGljeUpTT04pXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcG9saWN5RG9jLmFkZFN0YXRlbWVudHMoY3VzdG9tUmVzb3VyY2VQb2xpY3lTdGF0ZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBvbGljeURvYztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFkZFJlc291cmNlVGhyb3dzKCk6IGFwaWdhdGV3YXkuUmVzb3VyY2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJDYW5ub3QgY2FsbCAnYWRkUmVzb3VyY2UnIG9uIGEgcHJveHlpbmcgQUdTUmVzdEFwaTsgc2V0ICdlbmFibGVQcm94eUFsbCcgdG8gZmFsc2VcIlxuICAgICk7XG59XG5cbmZ1bmN0aW9uIGFkZE1ldGhvZFRocm93cygpOiBhcGlnYXRld2F5Lk1ldGhvZCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkNhbm5vdCBjYWxsICdhZGRNZXRob2QnIG9uIGEgcHJveHlpbmcgQUdTUmVzdEFwaTsgc2V0ICdlbmFibGVQcm94eUFsbCcgdG8gZmFsc2VcIlxuICAgICk7XG59XG5cbmZ1bmN0aW9uIGFkZFByb3h5VGhyb3dzKCk6IGFwaWdhdGV3YXkuUHJveHlSZXNvdXJjZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkNhbm5vdCBjYWxsICdhZGRQcm94eScgb24gYSBwcm94eWluZyBBR1NSZXN0QXBpOyBzZXQgJ2VuYWJsZVByb3h5QWxsJyB0byBmYWxzZVwiXG4gICAgKTtcbn1cbiJdfQ==