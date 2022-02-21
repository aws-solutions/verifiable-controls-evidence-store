import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import { AGSLambdaFunction } from './ags-lambda-function';
import { AGSService } from './ags-service';
import * as lambda from '@aws-cdk/aws-lambda';
import { AGSRole } from './ags-types';
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
export declare class AGSRestApi extends cdk.Construct {
    readonly api: apigateway.LambdaRestApi;
    readonly versionAlias: lambda.Alias;
    readonly apiUrl: string;
    constructor(scope: cdk.Construct, id: string, props: AGSRestApiProps);
    private composeApiResourcePolicy;
}
