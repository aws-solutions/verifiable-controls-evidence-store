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
const cdk = require("aws-cdk-lib");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const ssm = require("aws-cdk-lib/aws-ssm");
const iam = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const ags_aspects_1 = require("./ags-aspects");
const wafv2 = require("aws-cdk-lib/aws-wafv2");
const ags_types_1 = require("./ags-types");
const constructs_1 = require("constructs");
class AGSRestApi extends constructs_1.Construct {
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
            defaultIntegration: new apigateway.LambdaIntegration(gwTarget, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXJlc3QtYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2Fncy1yZXN0LWFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7RUFjRTtBQUNGLG1DQUFtQztBQUNuQyx5REFBeUQ7QUFDekQsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUczQyxpREFBaUQ7QUFDakQsK0NBQW1EO0FBQ25ELCtDQUErQztBQUMvQywyQ0FBc0M7QUFDdEMsMkNBQXVDO0FBd0l2QyxNQUFhLFVBQVcsU0FBUSxzQkFBUztJQUtyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUM5QixNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztRQUNwRCxNQUFNLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDO1FBRTlELHFEQUFxRDtRQUNyRCxNQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxjQUFjLEtBQUssU0FBUyxDQUFDO1FBRXRFLDhCQUE4QjtRQUM5QixJQUFJLGNBQWMsR0FBRyxTQUFTLENBQUM7UUFDL0IsSUFBSSxjQUFjLEVBQUU7WUFDaEIsY0FBYyxHQUFHO2dCQUNiLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDO2dCQUN4QyxZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQzthQUMxRCxDQUFDO1NBQ0w7YUFBTTtZQUNILGNBQWMsR0FBRztnQkFDYixLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQzthQUN4QyxDQUFDO1NBQ0w7UUFFRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVB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QUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQzlELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLDJCQUEyQixDQUFDLENBQ3BFLENBQUM7WUFDRixTQUFTLENBQUMsYUFBYSxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDMUQ7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNyQixDQUFDO0NBQ0o7QUF6UkQsZ0NBeVJDO0FBRUQsU0FBUyxpQkFBaUI7SUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FDWCxtRkFBbUYsQ0FDdEYsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFTLGVBQWU7SUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FDWCxpRkFBaUYsQ0FDcEYsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFTLGNBQWM7SUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FDWCxnRkFBZ0YsQ0FDbkYsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIHNzbSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3NtJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IEFHU0xhbWJkYUZ1bmN0aW9uIH0gZnJvbSAnLi9hZ3MtbGFtYmRhLWZ1bmN0aW9uJztcbmltcG9ydCB7IEFHU1NlcnZpY2UgfSBmcm9tICcuL2Fncy1zZXJ2aWNlJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCB7IE9wdGlvbk1ldGhvZE5vQXV0aCB9IGZyb20gJy4vYWdzLWFzcGVjdHMnO1xuaW1wb3J0ICogYXMgd2FmdjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXdhZnYyJztcbmltcG9ydCB7IEFHU1JvbGUgfSBmcm9tICcuL2Fncy10eXBlcyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBBcGlFbmRwb2ludCB7XG4gICAgcmVzb3VyY2VQYXRoOiBzdHJpbmc7XG4gICAgaHR0cE1ldGhvZDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFHU0FwaUV4dGVybmFsVXNlclBlcm1pc3Npb24ge1xuICAgIGVuZHBvaW50czogQXBpRW5kcG9pbnRbXTtcbiAgICBhbGxvd2VkQUdTUm9sZXM6IEFHU1JvbGVbXTtcbiAgICBleGFjdE1hdGNoPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBR1NSZXN0QXBpUHJvcHMge1xuICAgIC8qKlxuICAgICAqIEFHUyBTZXJ2aWNlIE9iamVjdFxuICAgICAqL1xuICAgIHNlcnZpY2U6IEFHU1NlcnZpY2U7XG4gICAgLyoqXG4gICAgICogQSBMYW1iZGEgRnVuY3Rpb24gdG8gaGFuZGxlIEFQSSBSZXF1ZXN0XG4gICAgICovXG4gICAgbGFtYmRhRnVuY3Rpb246IEFHU0xhbWJkYUZ1bmN0aW9uO1xuICAgIC8qKlxuICAgICAqIEEgbGlzdCBvZiBwZXJtaXNzaW9ucyBmb3IgQUdTIEV4dGVybmFsIFVzZXJzXG4gICAgICpcbiAgICAgKiBBR1MgRXh0ZXJuYWwgVXNlciBjYW4gYmUgZ3JhbnRlZCBwZXJtaXNzaW9uIG9uIGVhY2ggaW5kaXZpZHVhbCBBUEkgZW5kcG9pbnQgKHJlc291cmNlIGFuZCBtZXRob2QpLlxuICAgICAqIFRoZSBwZXJtaXNzaW9uIGlzIGdyYW50ZWQgYnkgbWF0Y2hpbmcgdGhlIEFHU1JvbGUgbmFtZXMgdGhhdCBhcmUgc3BlY2lmaWVkIGluIHRoZSB1c2VyIHByb2ZpbGUgYWdhaW5zdFxuICAgICAqIHRoZSBhbGxvd2VkQUdTUm9sZXMgc3BlY2lmaWVkIGluIGFwaUV4dGVybmFsVXNlclBlcm1pc3Npb25zXG4gICAgICpcbiAgICAgKiBNdWx0aXBsZSBBUEkgZW5kcG9pbnRzIGNhbiBiZSBzcGVjaWZpZWQgaW4gb25lIEFHU0FwaUV4dGVybmFsVXNlclBlcm1pc3Npb24gYW5kIGFsc28gbXVsdGlwbGUgQUdTIFJvbGVzLlxuICAgICAqIFRoZSB1c2VyIHdpbGwgYmUgYWxsb3dlZCB0byBhY2Nlc3MgYWxsIEFQSSBlbmRwb2ludHMgbGlzdGVkIGluIHRoZSBBR1NBcGlFeHRlcm5hbFVzZXJQZXJtaXNzaW9uYXMgbG9uZyBhc1xuICAgICAqIHRoZSB1c2VyIGhhcyBhbnkgb2YgdGhlIHNwZWNpZmllZCBhbGxvd2VkIEFHUyBSb2xlcyBpbiB0aGUgdXNlciBwcm9maWxlLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAgIEFsbG93IERvbWFpbk93bmVyIG9yIExpbmUxUmlzayB0byBhY2Nlc3MgTGlzdCBhbmQgR2V0RGV0YWlscyBBUEkgZW5kcG9pbnRzLlxuICAgICAqICAgW1xuICAgICAqICAgICAgIHtcbiAgICAgKiAgICAgICAgICAgZW5kcG9pbnRzOiBbXG4gICAgICogICAgICAgICAgICAgICB7XG4gICAgICogICAgICAgICAgICAgICAgICAgcmVzb3VyY2VQYXRoOiAnY29udHJvbG9iamVjdGl2ZXMnLFxuICAgICAqICAgICAgICAgICAgICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxuICAgICAqICAgICAgICAgICAgICAgfSxcbiAgICAgKiAgICAgICAgICAgICAgIHtcbiAgICAgKiAgICAgICAgICAgICAgICAgICByZXNvdXJjZVBhdGg6ICdjb250cm9sb2JqZWN0aXZlcy8qJyxcbiAgICAgKiAgICAgICAgICAgICAgICAgICBodHRwTWV0aG9kOiAnR0VUJyxcbiAgICAgKiAgICAgICAgICAgICAgIH0sXG4gICAgICogICAgICAgICAgIF0sXG4gICAgICogICAgICAgICAgIGFsbG93ZWRBR1NSb2xlczogW0FHU1JvbGUuRE9NQUlOX09XTkVSLCBBR1NSb2xlLkxJTkVfT05FX1JJU0tdLFxuICAgICAqICAgICAgIH0sXG4gICAgICogICBdO1xuICAgICAqXG4gICAgICogICBVc2UgZXhhY3RNYXRjaCBpZiB0aGVyZSBpcyBvdmVybGFwcGVkIHJlc291cmNlIHBhdGguIFRoaXMgZXhhbXBsZSBiZWxvdyBvbmx5IGFsbG93IGBDaGllZlJpc2tPZmZpY2VgXG4gICAgICogICB0byBhY2Nlc3MgYFBVVCAvYnVzaW5lc3N1bml0cy9lbnRlcnByaXNlYCwgZXZlbiBEb21haW5Pd25lciBpcyBhbGxvd2VkIHRvIGFjY2VzcyBgUFVUIC9idXNpbmVzc3VuaXRzLypgXG4gICAgICogICBbXG4gICAgICogICAgICAge1xuICAgICAqICAgICAgICAgICBlbmRwb2ludHM6IFtcbiAgICAgKiAgICAgICAgICAgICAgIHtcbiAgICAgKiAgICAgICAgICAgICAgICAgICByZXNvdXJjZVBhdGg6ICdidXNpbmVzc3VuaXRzL2VudGVycHJpc2UnLFxuICAgICAqICAgICAgICAgICAgICAgICAgIGh0dHBNZXRob2Q6ICdQVVQnLFxuICAgICAqICAgICAgICAgICAgICAgfSxcbiAgICAgKiAgICAgICAgICAgXSxcbiAgICAgKiAgICAgICAgICAgYWxsb3dlZEFHU1JvbGVzOiBbQUdTUm9sZS5DSElFRl9SSVNLX09GRklDRV0sXG4gICAgICogICAgICAgICAgIGV4YWN0TWF0Y2g6IHRydWUsXG4gICAgICogICAgICAgfSxcbiAgICAgKiAgICAgICB7XG4gICAgICogICAgICAgICAgIGVuZHBvaW50czogW1xuICAgICAqICAgICAgICAgICAgICAge1xuICAgICAqICAgICAgICAgICAgICAgICAgIHJlc291cmNlUGF0aDogJ2J1c2luZXNzdW5pdHMvKicsXG4gICAgICogICAgICAgICAgICAgICAgICAgaHR0cE1ldGhvZDogJ1BVVCcsXG4gICAgICogICAgICAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgICBdLFxuICAgICAqICAgICAgICAgICBhbGxvd2VkQUdTUm9sZXM6IFtBR1NSb2xlLkRPTUFJTl9PV05FUl0sXG4gICAgICogICAgICAgfSxcbiAgICAgKiAgIF07XG4gICAgICpcbiAgICAgKlxuICAgICAqICAgQWxsb3cgZXZlcnlvbmUgdG8gYWNjZXNzIGFsbCBBUEkgZW5kcG9pbnRzIChObyBSZXN0cmljdGlvbilcbiAgICAgKiAgIFtcbiAgICAgKiAgICAgICB7XG4gICAgICogICAgICAgICAgIGVuZHBvaW50czogW1xuICAgICAqICAgICAgICAgICAgICAge1xuICAgICAqICAgICAgICAgICAgICAgICAgIHJlc291cmNlUGF0aDogJyonLFxuICAgICAqICAgICAgICAgICAgICAgICAgIGh0dHBNZXRob2Q6ICcqJyxcbiAgICAgKiAgICAgICAgICAgICAgIH0sXG4gICAgICogICAgICAgICAgIF0sXG4gICAgICogICAgICAgICAgIGFsbG93ZWRBR1NSb2xlczogW0FHU1JvbGUuRVZFUllPTkVdLFxuICAgICAqICAgICAgIH0sXG4gICAgICogICBdO1xuICAgICAqL1xuICAgIGFwaUV4dGVybmFsVXNlclBlcm1pc3Npb25zOiBBR1NBcGlFeHRlcm5hbFVzZXJQZXJtaXNzaW9uW107XG4gICAgLyoqXG4gICAgICogQSBsaXN0IG9mIEFHUyBTZXJ2aWNlIE5hbWVzIHRoYXQgYWxsb3cgYWNjZXNzIHRvIHRoaXMgQVBJLlxuICAgICAqXG4gICAgICogVGhpcyBpcyB0byBjb250cm9sIHdoaWNoIEFHUyBTZXJ2aWNlIGNhbiBhY2Nlc3MgdG8gdGhpcyBBUEkuXG4gICAgICpcbiAgICAgKiBWYWxpZCB2YWx1ZSBpcyBgL14oW2EtekEtWjAtOVxcLV9dKnxcXCopJC9gLiBFaXRoZXIgYSBuYW1lIG1hZGUgb2YgdXBwZXIvbG93ZXIgY2FzZSBsZXR0ZXJzLCBoeXBlbixcbiAgICAgKiB1bmRlcnNjb3JlLCBvciBhIHNpbmdsZSBhc3RyZXJvaWQgKCopIHRvIGFsbG93IEFMTC5cbiAgICAgKlxuICAgICAqIEBkZWZhdWx0ICogLSBhbGxvdyBBTEwgYWNjZXNzXG4gICAgICovXG4gICAgYWxsb3dlZFNlcnZpY2VOYW1lcz86IHN0cmluZ1tdO1xuICAgIC8qKlxuICAgICAqXG4gICAgICogSW5kaWNhdGUgd2hldGhlciBvciBub3QgcHJveHkgYWxsIHJlcXVlc3RzIHRvIHRoZSBkZWZhdWx0IGxhbWJkYSBoYW5kbGVyXG4gICAgICpcbiAgICAgKiBJZiB0cnVlLCByb3V0ZSBhbGwgcmVxdWVzdHMgdG8gdGhlIExhbWJkYSBGdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIElmIHNldCB0byBmYWxzZSwgeW91IHdpbGwgbmVlZCB0byBleHBsaWNpdGx5IGRlZmluZSB0aGUgQVBJIG1vZGVsIHVzaW5nXG4gICAgICogYGFkZFJlc291cmNlYCBhbmQgYGFkZE1ldGhvZGAgKG9yIGBhZGRQcm94eWApLlxuICAgICAqXG4gICAgICogQGRlZmF1bHQgdHJ1ZVxuICAgICAqL1xuICAgIGVuYWJsZVByb3h5QWxsPzogYm9vbGVhbjtcbiAgICAvKipcbiAgICAgKlxuICAgICAqIEluZGljYXRlIHdoZXRoZXIgb3Igbm90IHVzZSBsYW1iZGEgYWxpYXNcbiAgICAgKlxuICAgICAqIElmIHRydWUsIGNyZWF0ZSBsYW1iZGEgYWxpYXMgYXMgQVBJIGdhdGV3YXkgdGFyZ2V0XG4gICAgICpcbiAgICAgKlxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgZW5hYmxlQWxpYXM/OiBib29sZWFuO1xuICAgIC8qKlxuICAgICAqIEFsbG93IGludm9raW5nIG1ldGhvZCBmcm9tIEFXUyBDb25zb2xlIFVJIChmb3IgdGVzdGluZyBwdXJwb3NlcykuXG4gICAgICpcbiAgICAgKiBUaGlzIHdpbGwgYWRkIGFub3RoZXIgcGVybWlzc2lvbiB0byB0aGUgQVdTIExhbWJkYSByZXNvdXJjZSBwb2xpY3kgd2hpY2hcbiAgICAgKiB3aWxsIGFsbG93IHRoZSBgdGVzdC1pbnZva2Utc3RhZ2VgIHN0YWdlIHRvIGludm9rZSB0aGlzIGhhbmRsZXIuIElmIHRoaXNcbiAgICAgKiBpcyBzZXQgdG8gYGZhbHNlYCwgdGhlIGZ1bmN0aW9uIHdpbGwgb25seSBiZSB1c2FibGUgZnJvbSB0aGUgZGVwbG95bWVudFxuICAgICAqIGVuZHBvaW50LlxuICAgICAqXG4gICAgICogQGRlZmF1bHQgdHJ1ZVxuICAgICAqL1xuICAgIGFsbG93VGVzdEludm9rZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBBR1NSZXN0QXBpIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LkxhbWJkYVJlc3RBcGk7XG4gICAgcHVibGljIHJlYWRvbmx5IHZlcnNpb25BbGlhczogbGFtYmRhLkFsaWFzO1xuICAgIHB1YmxpYyByZWFkb25seSBhcGlVcmw6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBR1NSZXN0QXBpUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICBjb25zdCBzZXJ2aWNlID0gcHJvcHMuc2VydmljZTtcbiAgICAgICAgY29uc3Qgc2hhcmVkSW5mcmFDbGllbnQgPSBzZXJ2aWNlLnNoYXJlZEluZnJhQ2xpZW50O1xuICAgICAgICBjb25zdCBkZXBsb3ltZW50T3B0aW9ucyA9IHNoYXJlZEluZnJhQ2xpZW50LmRlcGxveW1lbnRPcHRpb25zO1xuXG4gICAgICAgIC8vIENoZWNrIEFwaUdhdGV3YXkgdHlwZSB0byBkZWNpZGUgaWYgdXNlIFZwY0VuZHBvaW50XG4gICAgICAgIGNvbnN0IHVzZVZwY0VuZHBvaW50ID0gZGVwbG95bWVudE9wdGlvbnMuYXBpR2F0ZXdheVR5cGUgPT09ICdwcml2YXRlJztcblxuICAgICAgICAvLyBjb21wb3NlIFZwY0VuZHBvaW50IHNldHRpbmdcbiAgICAgICAgbGV0IGVuZHBvaW50Q29uZmlnID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAodXNlVnBjRW5kcG9pbnQpIHtcbiAgICAgICAgICAgIGVuZHBvaW50Q29uZmlnID0ge1xuICAgICAgICAgICAgICAgIHR5cGVzOiBbYXBpZ2F0ZXdheS5FbmRwb2ludFR5cGUuUFJJVkFURV0sXG4gICAgICAgICAgICAgICAgdnBjRW5kcG9pbnRzOiBbc2hhcmVkSW5mcmFDbGllbnQuYXBpZ2F0ZXdheVZwY0VuZHBvaW50XSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbmRwb2ludENvbmZpZyA9IHtcbiAgICAgICAgICAgICAgICB0eXBlczogW2FwaWdhdGV3YXkuRW5kcG9pbnRUeXBlLkVER0VdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudmVyc2lvbkFsaWFzID0gbmV3IGxhbWJkYS5BbGlhcyh0aGlzLCAnYWxpYXMnLCB7XG4gICAgICAgICAgICBhbGlhc05hbWU6ICdwcm9kJyxcbiAgICAgICAgICAgIHZlcnNpb246IHByb3BzLmxhbWJkYUZ1bmN0aW9uLmxhbWJkYUZ1bmN0aW9uLmN1cnJlbnRWZXJzaW9uLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBnd1RhcmdldDogbGFtYmRhLklGdW5jdGlvbiA9IHByb3BzLmVuYWJsZUFsaWFzXG4gICAgICAgICAgICA/IHRoaXMudmVyc2lvbkFsaWFzXG4gICAgICAgICAgICA6IHByb3BzLmxhbWJkYUZ1bmN0aW9uLmxhbWJkYUZ1bmN0aW9uO1xuXG4gICAgICAgIHRoaXMuYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCBgQVBJYCwge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IGBSZXN0IEFwaSBmb3IgJHtzZXJ2aWNlLnNlcnZpY2VOYW1lfWAsXG4gICAgICAgICAgICBkZWZhdWx0SW50ZWdyYXRpb246IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGd3VGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgcHJveHk6IHRydWUsIC8vbGFtYmRhIHByb3h5IHNob3VsZCBiZSBhbHdheXMgb25cbiAgICAgICAgICAgICAgICBhbGxvd1Rlc3RJbnZva2U6IHByb3BzLmFsbG93VGVzdEludm9rZSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVmYXVsdE1ldGhvZE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5JQU0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9saWN5OiB0aGlzLmNvbXBvc2VBcGlSZXNvdXJjZVBvbGljeShcbiAgICAgICAgICAgICAgICBzZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByb3BzLmFwaUV4dGVybmFsVXNlclBlcm1pc3Npb25zLFxuICAgICAgICAgICAgICAgIHByb3BzLmFsbG93ZWRTZXJ2aWNlTmFtZXNcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBlbmRwb2ludENvbmZpZ3VyYXRpb246IGVuZHBvaW50Q29uZmlnLFxuICAgICAgICAgICAgZGVwbG95T3B0aW9uczogeyBtZXRyaWNzRW5hYmxlZDogdHJ1ZSwgdHJhY2luZ0VuYWJsZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHJlc3RBcGlOYW1lOiBgJHtzZXJ2aWNlLnNlcnZpY2VOYW1lfS1BUElgLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBhZGQgQ09SUyBoZWFkZXIgdG8gQVBJR2F0ZXdheSBEZWZhdWx0IDR4eCBhbmQgNXh4IHJlc3BvbnNlc1xuICAgICAgICAvLyBzbyB0aGF0IGJyb3dzZXIgY2FuIHJlY2VpdmUgdGhlIHN0YXR1cyBjb2RlIGFuZCBlcnJvciBtZXNzYWdlXG4gICAgICAgIHRoaXMuYXBpLmFkZEdhdGV3YXlSZXNwb25zZSgnZGVmYXVsdC00eHgnLCB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5LlJlc3BvbnNlVHlwZS5ERUZBVUxUXzRYWCxcbiAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdhY2Nlc3MtY29udHJvbC1hbGxvdy1vcmlnaW4nOiBgJyonYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYXBpLmFkZEdhdGV3YXlSZXNwb25zZSgnZGVmYXVsdC01eHgnLCB7XG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5LlJlc3BvbnNlVHlwZS5ERUZBVUxUXzVYWCxcbiAgICAgICAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdhY2Nlc3MtY29udHJvbC1hbGxvdy1vcmlnaW4nOiBgJyonYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChwcm9wcy5lbmFibGVQcm94eUFsbCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRoaXMuYXBpLnJvb3QuYWRkUHJveHkoKTtcblxuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHVzZXJzIGNhbm5vdCBjYWxsIGFueSBvdGhlciByZXNvdXJjZSBhZGRpbmcgZnVuY3Rpb25cbiAgICAgICAgICAgIHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UgPSBhZGRSZXNvdXJjZVRocm93cztcbiAgICAgICAgICAgIHRoaXMuYXBpLnJvb3QuYWRkTWV0aG9kID0gYWRkTWV0aG9kVGhyb3dzO1xuICAgICAgICAgICAgdGhpcy5hcGkucm9vdC5hZGRQcm94eSA9IGFkZFByb3h5VGhyb3dzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IE9QVElPTlMgbWV0aG9kIHdpdGggTk9ORSBhdXRoZW50aWNhdGlvbiBmb3IgYnJvd3NlciB0byBhY2Nlc3MuXG4gICAgICAgIC8vIEJhc2VkIG9uIFczIHNwZWMsIENPUlMtcHJlZmxpZ2h0IHJlcXVlc3QgbmV2ZXIgaW5jbHVkZXMgY3JlZGVudGlhbHMuXG4gICAgICAgIC8vIGh0dHBzOi8vZmV0Y2guc3BlYy53aGF0d2cub3JnLyNjb3JzLXByb3RvY29sLWFuZC1jcmVkZW50aWFsc1xuICAgICAgICBjZGsuQXNwZWN0cy5vZih0aGlzLmFwaSkuYWRkKG5ldyBPcHRpb25NZXRob2ROb0F1dGgoKSk7XG5cbiAgICAgICAgLy8gYXNzb2NpYXRlIFdBRiBXZWJBQ0wgdG8gQVBJR2F0ZXdheSBpZiBXZWJBQ0wgQVJOIGlzIHNwZWNpZmllZFxuICAgICAgICBpZiAoc2hhcmVkSW5mcmFDbGllbnQuYXBpR2F0ZXdheVdlYkFjbEFybi5zdGFydHNXaXRoKCdhcm46YXdzOndhZnYyJywgMCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHdlYkFDTEFzc29jaWF0aW9uID0gbmV3IHdhZnYyLkNmbldlYkFDTEFzc29jaWF0aW9uKFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgJ1dlYkFDTEFzc29jaWF0aW9uJyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlQXJuOiBgYXJuOiR7Y2RrLkF3cy5QQVJUSVRJT059OmFwaWdhdGV3YXk6JHtjZGsuQXdzLlJFR0lPTn06Oi9yZXN0YXBpcy8ke3RoaXMuYXBpLnJlc3RBcGlJZH0vc3RhZ2VzL3Byb2RgLFxuICAgICAgICAgICAgICAgICAgICB3ZWJBY2xBcm46IHNoYXJlZEluZnJhQ2xpZW50LmFwaUdhdGV3YXlXZWJBY2xBcm4sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHdlYkFDTEFzc29jaWF0aW9uLm5vZGUuYWRkRGVwZW5kZW5jeSh0aGlzLmFwaSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzc20gcGFyYW1ldGVyIGZvciBBcGlHYXRld2F5IEVuZHBvaW50IFVSTFxuICAgICAgICB0aGlzLmFwaVVybCA9IHVzZVZwY0VuZHBvaW50XG4gICAgICAgICAgICA/IGBodHRwczovLyR7dGhpcy5hcGkucmVzdEFwaUlkfS0ke3NoYXJlZEluZnJhQ2xpZW50LmFwaWdhdGV3YXlWcGNFbmRwb2ludC52cGNFbmRwb2ludElkfS5leGVjdXRlLWFwaS4ke2Nkay5Bd3MuUkVHSU9OfS4ke2Nkay5Bd3MuVVJMX1NVRkZJWH0vJHt0aGlzLmFwaS5kZXBsb3ltZW50U3RhZ2Uuc3RhZ2VOYW1lfS9gXG4gICAgICAgICAgICA6IHRoaXMuYXBpLnVybDtcblxuICAgICAgICBuZXcgc3NtLlN0cmluZ1BhcmFtZXRlcih0aGlzLCAnQXBpVXJsJywge1xuICAgICAgICAgICAgcGFyYW1ldGVyTmFtZTogYC9hZ3MvZW5kcG9pbnRzLyR7c2VydmljZS5zZXJ2aWNlTmFtZX1gLFxuICAgICAgICAgICAgc3RyaW5nVmFsdWU6IHRoaXMuYXBpVXJsLFxuICAgICAgICB9KTtcblxuICAgICAgICBuZXcgc3NtLlN0cmluZ1BhcmFtZXRlcih0aGlzLCAnQXBpSG9zdCcsIHtcbiAgICAgICAgICAgIHBhcmFtZXRlck5hbWU6IGAvYWdzL2hvc3RuYW1lcy8ke3NlcnZpY2Uuc2VydmljZU5hbWV9YCxcbiAgICAgICAgICAgIHN0cmluZ1ZhbHVlOiBgJHt0aGlzLmFwaS5yZXN0QXBpSWR9LmV4ZWN1dGUtYXBpLiR7Y2RrLkF3cy5SRUdJT059LiR7Y2RrLkF3cy5VUkxfU1VGRklYfWAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNoZWNrIEFwaUdhdGV3YXkgdHlwZSB0byBkZWNpZGUgaWYgYWRkZWQgaXQgdG8gQ2xvdWRGcm9udFxuICAgICAgICBpZiAoZGVwbG95bWVudE9wdGlvbnMuYXBpR2F0ZXdheVR5cGUgPT09ICdjbG91ZGZyb250Jykge1xuICAgICAgICAgICAgLy8gVE9ETzogVXNlIERpc3RyaWJ1dGlvbk9yaWdpbkF0dGFjaG1lbnQgY3VzdG9tIHJlc291cmNlIGluIFNoYXJlZCBJbmZyYVxuICAgICAgICAgICAgLy8gdG8gYWRkIHRoZSBBUElHYXRld2F5IGFzIEN1c3RvbU9yaWdpbiB0byB0aGUgQ2xvdWRGcm9udCBkaXN0cmlidXRpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBUElHYXRld2F5IFR5cGUgY2xvdWRmcm9udCBpcyBub3Qgc3VwcG9ydCB5ZXQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgY29tcG9zZUFwaVJlc291cmNlUG9saWN5KFxuICAgICAgICBzZXJ2aWNlOiBBR1NTZXJ2aWNlLFxuICAgICAgICBhcGlFeHRlcm5hbFVzZXJQZXJtaXNzaW9uczogQUdTQXBpRXh0ZXJuYWxVc2VyUGVybWlzc2lvbltdLFxuICAgICAgICBhbGxvd2VkU2VydmljZU5hbWVzOiBzdHJpbmdbXSA9IFsnKiddXG4gICAgKTogaWFtLlBvbGljeURvY3VtZW50IHtcbiAgICAgICAgY29uc3QgZW5hYmxlZERldmVsb3BtZW50VXNlclJvbGUgPVxuICAgICAgICAgICAgc2VydmljZS5zaGFyZWRJbmZyYUNsaWVudC5kZXBsb3ltZW50T3B0aW9ucy5kZXZlbG9wbWVudFVzZXJSb2xlO1xuXG4gICAgICAgIC8vIHZlcmlmeSB0aGUgQUdTUm9sZSBhbmQgb25seSBhbGxvdyB0aGUgcHJlZGZpbmVkIG9uZXNcbiAgICAgICAgY29uc3QgYWdzUm9sZU5hbWVzID0gT2JqZWN0LnZhbHVlcyhBR1NSb2xlKTtcbiAgICAgICAgY29uc3QgaW52YWxpZEFHU1JvbGVOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgYXBpRXh0ZXJuYWxVc2VyUGVybWlzc2lvbnMuZm9yRWFjaCgocGVybWlzc2lvbikgPT4ge1xuICAgICAgICAgICAgcGVybWlzc2lvbi5hbGxvd2VkQUdTUm9sZXMuZm9yRWFjaCgocm9sZU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWFnc1JvbGVOYW1lcy5pbmNsdWRlcyhyb2xlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52YWxpZEFHU1JvbGVOYW1lcy5wdXNoKHJvbGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGludmFsaWRBR1NSb2xlTmFtZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICdJbnZhbGlkIEFHU1JvbGUgbmFtZXMgYXJlIGNvbmZpZ3VyZWQgaW4gYXBpRXh0ZXJuYWxVc2VyUGVybWlzc2lvbnMuICcgK1xuICAgICAgICAgICAgICAgICAgICBgWyR7aW52YWxpZEFHU1JvbGVOYW1lcy5qb2luKCcsICcpfV1gXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZ2VuZXJhdGUgQXR0cmlidXRlIEJhc2VkIEFjY2VzcyBDb250cm9sIHN0YXRlbWVudHMgZm9yIEFHU0V4dGVybmFsVXNlclJvbGVcbiAgICAgICAgY29uc3QgZXh0ZXJuYWxVc2VyU3RhdGVtZW50czogaWFtLlBvbGljeVN0YXRlbWVudFtdID0gW107XG4gICAgICAgIGFwaUV4dGVybmFsVXNlclBlcm1pc3Npb25zLmZvckVhY2goKHBlcm1pc3Npb246IEFHU0FwaUV4dGVybmFsVXNlclBlcm1pc3Npb24pID0+IHtcbiAgICAgICAgICAgIC8vIGdlbmVyYXRlIHJlc291cmNlIGxpc3Qgb2YgdGhpcyBzdGF0ZW1lbnRcbiAgICAgICAgICAgIGNvbnN0IHJlc291cmNlcyA9IHBlcm1pc3Npb24uZW5kcG9pbnRzLm1hcChcbiAgICAgICAgICAgICAgICAoeyByZXNvdXJjZVBhdGgsIGh0dHBNZXRob2QgfSkgPT5cbiAgICAgICAgICAgICAgICAgICAgYGV4ZWN1dGUtYXBpOi8qLyR7aHR0cE1ldGhvZC50b1VwcGVyQ2FzZSgpfS8ke3Jlc291cmNlUGF0aH1gXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCBhZ3NSb2xlTGlzdCA9IHBlcm1pc3Npb24uYWxsb3dlZEFHU1JvbGVzLm1hcCgocm9sZU5hbWUpID0+XG4gICAgICAgICAgICAgICAgcm9sZU5hbWUgPT09IEFHU1JvbGUuRVZFUllPTkUgPyAnKicgOiBgKiR7cm9sZU5hbWV9KmBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhZ3NSb2xlTGlzdC5wdXNoKGAqJHtBR1NSb2xlLlNZU1RFTV9BRE1JTn0qYCk7XG5cbiAgICAgICAgICAgIC8vIGFsbG93IHN0YXRlbWVudFxuICAgICAgICAgICAgY29uc3QgYWxsb3dTdGF0ZW1lbnQgPSBpYW0uUG9saWN5U3RhdGVtZW50LmZyb21Kc29uKHtcbiAgICAgICAgICAgICAgICBFZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgIEFXUzogYGFybjphd3M6aWFtOjoke2Nkay5Bd3MuQUNDT1VOVF9JRH06cm9sZS9BR1NFeHRlcm5hbFVzZXJSb2xlYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEFjdGlvbjogJ2V4ZWN1dGUtYXBpOkludm9rZScsXG4gICAgICAgICAgICAgICAgUmVzb3VyY2U6IHJlc291cmNlcyxcbiAgICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgU3RyaW5nTGlrZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2F3czpQcmluY2lwYWxUYWcvQUdTUm9sZXMnOiBhZ3NSb2xlTGlzdCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBleHRlcm5hbFVzZXJTdGF0ZW1lbnRzLnB1c2goYWxsb3dTdGF0ZW1lbnQpO1xuXG4gICAgICAgICAgICAvLyBhZGQgZGVueSBzdGF0ZW1lbnQgaWYgZXhhY3RNYXRjaCBpcyB0cnVlXG4gICAgICAgICAgICBpZiAocGVybWlzc2lvbi5leGFjdE1hdGNoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVueVN0YXRlbWVudCA9IGlhbS5Qb2xpY3lTdGF0ZW1lbnQuZnJvbUpzb24oe1xuICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IGlhbS5FZmZlY3QuREVOWSxcbiAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBBV1M6IGBhcm46YXdzOmlhbTo6JHtjZGsuQXdzLkFDQ09VTlRfSUR9OnJvbGUvQUdTRXh0ZXJuYWxVc2VyUm9sZWAsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIEFjdGlvbjogJ2V4ZWN1dGUtYXBpOkludm9rZScsXG4gICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiByZXNvdXJjZXMsXG4gICAgICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0ZvckFsbFZhbHVlczpTdHJpbmdOb3RMaWtlSWZFeGlzdHMnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2F3czpQcmluY2lwYWxUYWcvQUdTUm9sZXMnOiBhZ3NSb2xlTGlzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxVc2VyU3RhdGVtZW50cy5wdXNoKGRlbnlTdGF0ZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbGxvdyBIVFRQIFByZWZsaWdodFxuICAgICAgICBjb25zdCBwcmVmbGlnaHRTdGF0ZW1lbnQgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5BbnlQcmluY2lwYWwoKV0sXG4gICAgICAgICAgICBhY3Rpb25zOiBbJ2V4ZWN1dGUtYXBpOkludm9rZSddLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbJ2V4ZWN1dGUtYXBpOi8qL09QVElPTlMvKiddLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbGxvdyBvdGhlciBBR1MgU2VydmljZSB0byBhY2Nlc3MgdGhpcyBBUEkgYmFzZWQgb24gQWxsb3cgTGlzdCBvZiBTZXJ2aWNlIE5hbWVcbiAgICAgICAgLy8gYWRkIHRydXN0ZWQgZGV2ZWxvcGVyIGFjY291bnQgaW50byBhbGxvd2VkIHByaW5jaXBhbCBsaXN0IGZvciBpbiBkZXZlbG9wbWVudCBlbnZpcm9ubWVudFxuICAgICAgICBjb25zdCB0cnVzdGVkRGV2ZWxvcGVyQWNjb3VudHMgPVxuICAgICAgICAgICAgc2VydmljZS5zaGFyZWRJbmZyYUNsaWVudC50cnVzdGVkRGV2ZWxvcGVyQWNjb3VudHM7XG4gICAgICAgIGNvbnN0IHByaW5jaXBhbEFjY291bnRzID0gZW5hYmxlZERldmVsb3BtZW50VXNlclJvbGVcbiAgICAgICAgICAgID8gW2Nkay5Bd3MuQUNDT1VOVF9JRCwgLi4udHJ1c3RlZERldmVsb3BlckFjY291bnRzXVxuICAgICAgICAgICAgOiBbY2RrLkF3cy5BQ0NPVU5UX0lEXTtcblxuICAgICAgICBjb25zdCBhY2NvdW50Q29uZGl0aW9ucyA9IHtcbiAgICAgICAgICAgIC8vIGZvciBhbnkgaWRlbnRpdHkgaW4gQUdTIFNlcnZpY2UgQWNjb3VudCBvciBUcnVzdGVkIERldmVsb3BlciBBY2NvdW50IChpbiBkZXYgZW52KVxuICAgICAgICAgICAgJ0ZvckFueVZhbHVlOlN0cmluZ0VxdWFscyc6IHtcbiAgICAgICAgICAgICAgICAnYXdzOlByaW5jaXBhbEFjY291bnQnOiBwcmluY2lwYWxBY2NvdW50cyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBleGNsdWRlIEFHU0V4dGVybmFsVXNlclJvbGVcbiAgICAgICAgICAgIFN0cmluZ05vdExpa2U6IHtcbiAgICAgICAgICAgICAgICAnYXdzOlByaW5jaXBhbEFybic6IGBhcm46YXdzOmlhbTo6JHtjZGsuQXdzLkFDQ09VTlRfSUR9OnJvbGUvQUdTRXh0ZXJuYWxVc2VyUm9sZWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSAqL1xuICAgICAgICBsZXQgcG9saWN5Q29uZGl0aW9uczogUmVjb3JkPHN0cmluZywgYW55PiA9IGFjY291bnRDb25kaXRpb25zO1xuXG4gICAgICAgIC8vIG5vdCBhZGRkaW5nIHRoZSBhZ3M6c2VydmljZSB0YWcgY2hlY2sgaWYgaXQgaXMgZGV2ZWxvcG1lbnQgbW9kZSBzbyB0aGF0IGRldmVsb3BlclxuICAgICAgICAvLyBjYW4gY2FsbCBBUEkgZnJvbSBhbnkgcm9sZXMgaW4gdHJ1c3RlZCBkZXZlbG9wZXIgYWNjb3VudFxuICAgICAgICBpZiAoIWVuYWJsZWREZXZlbG9wbWVudFVzZXJSb2xlKSB7XG4gICAgICAgICAgICBwb2xpY3lDb25kaXRpb25zID0ge1xuICAgICAgICAgICAgICAgIC4uLnBvbGljeUNvbmRpdGlvbnMsXG4gICAgICAgICAgICAgICAgLy8gYW5kIHRoZSBjYWxsZXIgUm9sZSBtdXN0IHRvIGhhdmUgdGFnIGBhZ3M6c2VydmljZWAgd2l0aCBpdHMgc2VydmljZSBuYW1lIGFuZCBpdHMgc2VydmljZSBuYW1lXG4gICAgICAgICAgICAgICAgLy8gbXVzdCBiZSBpbiB0aGUgYWxsb3dlZCBsaXN0IGZvciB0aGlzIHNlcnZpY2VcbiAgICAgICAgICAgICAgICAnRm9yQW55VmFsdWU6U3RyaW5nTGlrZSc6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2F3czpQcmluY2lwYWxUYWcvYWdzOnNlcnZpY2UnOiBhbGxvd2VkU2VydmljZU5hbWVzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VydmljZVVzZXJTdGF0ZW1lbnQgPSBpYW0uUG9saWN5U3RhdGVtZW50LmZyb21Kc29uKHtcbiAgICAgICAgICAgIEVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIEFXUzogJyonLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEFjdGlvbjogJ2V4ZWN1dGUtYXBpOkludm9rZScsXG4gICAgICAgICAgICBSZXNvdXJjZTogJ2V4ZWN1dGUtYXBpOi8qLyovKicsXG4gICAgICAgICAgICBDb25kaXRpb246IHBvbGljeUNvbmRpdGlvbnMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFsbG93IEFHU0RldmVsb3BtZW50VXNlclJvbGUgdG8gYWNjZXNzIHRoaXMgQVBJIHdpdGhvdXQgcmVzdHJpY3Rpb25cbiAgICAgICAgY29uc3QgZGV2ZWxvcG1lbnRVc2VyU3RhdGVtZW50ID0gaWFtLlBvbGljeVN0YXRlbWVudC5mcm9tSnNvbih7XG4gICAgICAgICAgICBFZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBBV1M6IGBhcm46YXdzOmlhbTo6JHtjZGsuQXdzLkFDQ09VTlRfSUR9OnJvbGUvQUdTRGV2ZWxvcG1lbnRVc2VyUm9sZWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQWN0aW9uOiAnZXhlY3V0ZS1hcGk6SW52b2tlJyxcbiAgICAgICAgICAgIFJlc291cmNlOiAnZXhlY3V0ZS1hcGk6LyovKi8qJyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcG9saWN5RG9jID0gbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCgpO1xuICAgICAgICBwb2xpY3lEb2MuYWRkU3RhdGVtZW50cyguLi5leHRlcm5hbFVzZXJTdGF0ZW1lbnRzKTtcbiAgICAgICAgcG9saWN5RG9jLmFkZFN0YXRlbWVudHMoc2VydmljZVVzZXJTdGF0ZW1lbnQpO1xuICAgICAgICBpZiAoZW5hYmxlZERldmVsb3BtZW50VXNlclJvbGUpIHtcbiAgICAgICAgICAgIHBvbGljeURvYy5hZGRTdGF0ZW1lbnRzKGRldmVsb3BtZW50VXNlclN0YXRlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcG9saWN5RG9jLmFkZFN0YXRlbWVudHMocHJlZmxpZ2h0U3RhdGVtZW50KTtcblxuICAgICAgICAvLyBjdXN0b20gcmVzb3VyY2UgcG9saWN5XG4gICAgICAgIGlmIChzZXJ2aWNlLnNoYXJlZEluZnJhQ2xpZW50LmN1c3RvbUFQSVJlc291cmNlUG9saWN5SlNPTiAhPT0gJ05PTkUnKSB7XG4gICAgICAgICAgICBjb25zdCBjdXN0b21SZXNvdXJjZVBvbGljeVN0YXRlbWVudCA9IGlhbS5Qb2xpY3lTdGF0ZW1lbnQuZnJvbUpzb24oXG4gICAgICAgICAgICAgICAgSlNPTi5wYXJzZShzZXJ2aWNlLnNoYXJlZEluZnJhQ2xpZW50LmN1c3RvbUFQSVJlc291cmNlUG9saWN5SlNPTilcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBwb2xpY3lEb2MuYWRkU3RhdGVtZW50cyhjdXN0b21SZXNvdXJjZVBvbGljeVN0YXRlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcG9saWN5RG9jO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkUmVzb3VyY2VUaHJvd3MoKTogYXBpZ2F0ZXdheS5SZXNvdXJjZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkNhbm5vdCBjYWxsICdhZGRSZXNvdXJjZScgb24gYSBwcm94eWluZyBBR1NSZXN0QXBpOyBzZXQgJ2VuYWJsZVByb3h5QWxsJyB0byBmYWxzZVwiXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gYWRkTWV0aG9kVGhyb3dzKCk6IGFwaWdhdGV3YXkuTWV0aG9kIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiQ2Fubm90IGNhbGwgJ2FkZE1ldGhvZCcgb24gYSBwcm94eWluZyBBR1NSZXN0QXBpOyBzZXQgJ2VuYWJsZVByb3h5QWxsJyB0byBmYWxzZVwiXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gYWRkUHJveHlUaHJvd3MoKTogYXBpZ2F0ZXdheS5Qcm94eVJlc291cmNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiQ2Fubm90IGNhbGwgJ2FkZFByb3h5JyBvbiBhIHByb3h5aW5nIEFHU1Jlc3RBcGk7IHNldCAnZW5hYmxlUHJveHlBbGwnIHRvIGZhbHNlXCJcbiAgICApO1xufVxuIl19