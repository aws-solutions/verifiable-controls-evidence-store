"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGSLambdaFunction = void 0;
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
const iam = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const ags_types_1 = require("./ags-types");
const constructs_1 = require("constructs");
class AGSLambdaFunction extends constructs_1.Construct {
    constructor(scope, id, props) {
        var _a, _b, _c;
        super(scope, id);
        const service = props.service;
        const sharedInfraClient = service.sharedInfraClient;
        const subnetGroup = (_a = props.subnetGroup) !== null && _a !== void 0 ? _a : ags_types_1.SubnetGroup.SERVICE;
        // Add the inline policy to enable lambda to call any other APIs
        // It is only necessary when a service is running in a different account
        // from team shared account and need to call its dependency services across-account
        // This is a wildcard policy as the APIGateway has resource policy to limit the access.
        const allowCrossAccountAPIPolicyDoc = new iam.PolicyDocument({
            statements: [
                iam.PolicyStatement.fromJson({
                    Effect: iam.Effect.ALLOW,
                    Action: 'execute-api:Invoke',
                    Resource: 'arn:aws:execute-api:*:*:*/*/*/*',
                }),
            ],
        });
        const allowSSMParamAccess = new iam.PolicyStatement({
            resources: [
                `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/ags/*`,
            ],
            effect: iam.Effect.ALLOW,
            actions: [
                'ssm:DescribeParameters',
                'ssm:GetParameter',
                'ssm:GetParameterHistory',
                'ssm:GetParameters',
            ],
        });
        let inlinePolicies = sharedInfraClient.deploymentOptions.developmentUserRole
            ? {
                AllowCrossAccountApiPolicy: allowCrossAccountAPIPolicyDoc,
            }
            : undefined;
        if (props.initialPolicy) {
            const initialPolicyDoc = new iam.PolicyDocument({
                statements: props.initialPolicy,
            });
            if (inlinePolicies) {
                inlinePolicies.CustomPolicy = initialPolicyDoc;
            }
            else {
                inlinePolicies = {
                    CustomPolicy: initialPolicyDoc,
                };
            }
        }
        // get AGS custom managed Lambda execution policies
        const agsLambdaBasicExecutionPolicy = iam.ManagedPolicy.fromManagedPolicyName(this, 'AGSLambdaBasicExecutionPolicy', 'AGSLambdaBasicExecutionPolicy');
        const agsLambdaVPCAccessExecutionPolicy = iam.ManagedPolicy.fromManagedPolicyName(this, 'AGSLambdaVPCAccessExecutionPolicy', 'AGSLambdaVPCAccessExecutionPolicy');
        // compose managed policies
        const managedPolicies = ((_b = props.disableDefaultLambdaExecutionPolicy) !== null && _b !== void 0 ? _b : false) ? []
            : [
                sharedInfraClient.vpc
                    ? agsLambdaVPCAccessExecutionPolicy
                    : agsLambdaBasicExecutionPolicy,
            ];
        if (props.managedPolicies) {
            managedPolicies.push(...props.managedPolicies);
        }
        // One Lambda Function is by default provisioned
        this.lambdaExecutionRole = new iam.Role(this, 'ExecutionRole', {
            ...(props.iamRoleName && { roleName: props.iamRoleName }),
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: `Lambda execution role for ${service.serviceName}-${id}`,
            managedPolicies,
            inlinePolicies: inlinePolicies,
        });
        this.lambdaExecutionRole.addToPolicy(allowSSMParamAccess);
        // tag the lambda execution role with service name (again) for attribute based access control
        cdk.Tags.of(this.lambdaExecutionRole).add('ags:service', service.serviceName);
        // security groups
        const securityGroups = ((_c = props.securityGroups) !== null && _c !== void 0 ? _c : []).slice();
        const subnetSecurityGroups = sharedInfraClient.getSubnetSecurityGroups(subnetGroup);
        // append subnet security groups
        if (subnetSecurityGroups) {
            securityGroups.push(...subnetSecurityGroups);
        }
        // replace securityGroups in lambda if subnetSecurityGroup is found
        const lambdaProps = securityGroups.length === 0 ? props : { ...props, securityGroups };
        this.lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
            ...lambdaProps,
            role: this.lambdaExecutionRole,
            // lambda use optional Customer KMS key as in most of the case,
            // environmentEncryption can use AWS managed Key instead of custoemr KMS Key.
            environmentEncryption: service.getOptionalKMSKey(id),
            vpc: sharedInfraClient.vpc,
            vpcSubnets: sharedInfraClient.getSubnetsByGroupName(subnetGroup),
            tracing: lambda.Tracing.ACTIVE,
        });
    }
}
exports.AGSLambdaFunction = AGSLambdaFunction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLWxhbWJkYS1mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9hZ3MtbGFtYmRhLWZ1bmN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7Ozs7Ozs7Ozs7OztFQWNFO0FBQ0YsbUNBQW1DO0FBQ25DLDJDQUEyQztBQUMzQyxpREFBaUQ7QUFFakQsMkNBQTBDO0FBQzFDLDJDQUF1QztBQWN2QyxNQUFhLGlCQUFrQixTQUFRLHNCQUFTO0lBSTVDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBNkI7O1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUM5QixNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztRQUVwRCxNQUFNLFdBQVcsU0FBRyxLQUFLLENBQUMsV0FBVyxtQ0FBSSx1QkFBVyxDQUFDLE9BQU8sQ0FBQztRQUU3RCxnRUFBZ0U7UUFDaEUsd0VBQXdFO1FBQ3hFLG1GQUFtRjtRQUNuRix1RkFBdUY7UUFDdkYsTUFBTSw2QkFBNkIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUM7WUFDekQsVUFBVSxFQUFFO2dCQUNSLEdBQUcsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDO29CQUN6QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO29CQUN4QixNQUFNLEVBQUUsb0JBQW9CO29CQUM1QixRQUFRLEVBQUUsaUNBQWlDO2lCQUM5QyxDQUFDO2FBQ0w7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNoRCxTQUFTLEVBQUU7Z0JBQ1AsZUFBZSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsa0JBQWtCO2FBQ3hFO1lBQ0QsTUFB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Q0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQztRQUV2RSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDOUQsR0FBRyxXQUFXO1lBQ2QsSUFBSSxFQUFFLElBQUksQ0FBQyxtQkFBbUI7WUFDOUIsK0RBQStEO1lBQy9ELDZFQUE2RTtZQUM3RSxxQkFBcUIsRUFBRSxPQUFPLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO1lBQ3BELEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxHQUFHO1lBQzFCLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUM7WUFDaEUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTTtTQUNqQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUE1SEQsOENBNEhDIiwic291cmNlc0NvbnRlbnQiOlsiLyogXG4gIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICBcbiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKS5cbiAgWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgXG4gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgXG4gIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQUdTU2VydmljZSB9IGZyb20gJy4vYWdzLXNlcnZpY2UnO1xuaW1wb3J0IHsgU3VibmV0R3JvdXAgfSBmcm9tICcuL2Fncy10eXBlcyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBBR1NMYW1iZGFGdW5jdGlvblByb3BzXG4gICAgZXh0ZW5kcyBPbWl0PFxuICAgICAgICBsYW1iZGEuRnVuY3Rpb25Qcm9wcyxcbiAgICAgICAgJ2FsbG93UHVibGljU3VibmV0JyB8ICdyb2xlJyB8ICd2cGMnIHwgJ3ZwY1N1Ym5ldHMnXG4gICAgPiB7XG4gICAgc2VydmljZTogQUdTU2VydmljZTtcbiAgICBpYW1Sb2xlTmFtZT86IHN0cmluZztcbiAgICBtYW5hZ2VkUG9saWNpZXM/OiBpYW0uTWFuYWdlZFBvbGljeVtdO1xuICAgIGRpc2FibGVEZWZhdWx0TGFtYmRhRXhlY3V0aW9uUG9saWN5PzogYm9vbGVhbjtcbiAgICBzdWJuZXRHcm91cD86IFN1Ym5ldEdyb3VwO1xufVxuXG5leHBvcnQgY2xhc3MgQUdTTGFtYmRhRnVuY3Rpb24gZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAgIHB1YmxpYyByZWFkb25seSBsYW1iZGFGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuICAgIHB1YmxpYyByZWFkb25seSBsYW1iZGFFeGVjdXRpb25Sb2xlOiBpYW0uUm9sZTtcblxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBR1NMYW1iZGFGdW5jdGlvblByb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAgICAgY29uc3Qgc2VydmljZSA9IHByb3BzLnNlcnZpY2U7XG4gICAgICAgIGNvbnN0IHNoYXJlZEluZnJhQ2xpZW50ID0gc2VydmljZS5zaGFyZWRJbmZyYUNsaWVudDtcblxuICAgICAgICBjb25zdCBzdWJuZXRHcm91cCA9IHByb3BzLnN1Ym5ldEdyb3VwID8/IFN1Ym5ldEdyb3VwLlNFUlZJQ0U7XG5cbiAgICAgICAgLy8gQWRkIHRoZSBpbmxpbmUgcG9saWN5IHRvIGVuYWJsZSBsYW1iZGEgdG8gY2FsbCBhbnkgb3RoZXIgQVBJc1xuICAgICAgICAvLyBJdCBpcyBvbmx5IG5lY2Vzc2FyeSB3aGVuIGEgc2VydmljZSBpcyBydW5uaW5nIGluIGEgZGlmZmVyZW50IGFjY291bnRcbiAgICAgICAgLy8gZnJvbSB0ZWFtIHNoYXJlZCBhY2NvdW50IGFuZCBuZWVkIHRvIGNhbGwgaXRzIGRlcGVuZGVuY3kgc2VydmljZXMgYWNyb3NzLWFjY291bnRcbiAgICAgICAgLy8gVGhpcyBpcyBhIHdpbGRjYXJkIHBvbGljeSBhcyB0aGUgQVBJR2F0ZXdheSBoYXMgcmVzb3VyY2UgcG9saWN5IHRvIGxpbWl0IHRoZSBhY2Nlc3MuXG4gICAgICAgIGNvbnN0IGFsbG93Q3Jvc3NBY2NvdW50QVBJUG9saWN5RG9jID0gbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCh7XG4gICAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICAgICAgaWFtLlBvbGljeVN0YXRlbWVudC5mcm9tSnNvbih7XG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiAnZXhlY3V0ZS1hcGk6SW52b2tlJyxcbiAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6ICdhcm46YXdzOmV4ZWN1dGUtYXBpOio6KjoqLyovKi8qJyxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFsbG93U1NNUGFyYW1BY2Nlc3MgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICBgYXJuOmF3czpzc206JHtjZGsuQXdzLlJFR0lPTn06JHtjZGsuQXdzLkFDQ09VTlRfSUR9OnBhcmFtZXRlci9hZ3MvKmAsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdzc206RGVzY3JpYmVQYXJhbWV0ZXJzJyxcbiAgICAgICAgICAgICAgICAnc3NtOkdldFBhcmFtZXRlcicsXG4gICAgICAgICAgICAgICAgJ3NzbTpHZXRQYXJhbWV0ZXJIaXN0b3J5JyxcbiAgICAgICAgICAgICAgICAnc3NtOkdldFBhcmFtZXRlcnMnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGlubGluZVBvbGljaWVzOiBSZWNvcmQ8c3RyaW5nLCBpYW0uUG9saWN5RG9jdW1lbnQ+IHwgdW5kZWZpbmVkID1cbiAgICAgICAgICAgIHNoYXJlZEluZnJhQ2xpZW50LmRlcGxveW1lbnRPcHRpb25zLmRldmVsb3BtZW50VXNlclJvbGVcbiAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICBBbGxvd0Nyb3NzQWNjb3VudEFwaVBvbGljeTogYWxsb3dDcm9zc0FjY291bnRBUElQb2xpY3lEb2MsXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKHByb3BzLmluaXRpYWxQb2xpY3kpIHtcbiAgICAgICAgICAgIGNvbnN0IGluaXRpYWxQb2xpY3lEb2MgPSBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzOiBwcm9wcy5pbml0aWFsUG9saWN5LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChpbmxpbmVQb2xpY2llcykge1xuICAgICAgICAgICAgICAgIGlubGluZVBvbGljaWVzLkN1c3RvbVBvbGljeSA9IGluaXRpYWxQb2xpY3lEb2M7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlubGluZVBvbGljaWVzID0ge1xuICAgICAgICAgICAgICAgICAgICBDdXN0b21Qb2xpY3k6IGluaXRpYWxQb2xpY3lEb2MsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCBBR1MgY3VzdG9tIG1hbmFnZWQgTGFtYmRhIGV4ZWN1dGlvbiBwb2xpY2llc1xuICAgICAgICBjb25zdCBhZ3NMYW1iZGFCYXNpY0V4ZWN1dGlvblBvbGljeSA9IGlhbS5NYW5hZ2VkUG9saWN5LmZyb21NYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAnQUdTTGFtYmRhQmFzaWNFeGVjdXRpb25Qb2xpY3knLFxuICAgICAgICAgICAgJ0FHU0xhbWJkYUJhc2ljRXhlY3V0aW9uUG9saWN5J1xuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGFnc0xhbWJkYVZQQ0FjY2Vzc0V4ZWN1dGlvblBvbGljeSA9IGlhbS5NYW5hZ2VkUG9saWN5LmZyb21NYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAnQUdTTGFtYmRhVlBDQWNjZXNzRXhlY3V0aW9uUG9saWN5JyxcbiAgICAgICAgICAgICdBR1NMYW1iZGFWUENBY2Nlc3NFeGVjdXRpb25Qb2xpY3knXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gY29tcG9zZSBtYW5hZ2VkIHBvbGljaWVzXG4gICAgICAgIGNvbnN0IG1hbmFnZWRQb2xpY2llcyA9XG4gICAgICAgICAgICBwcm9wcy5kaXNhYmxlRGVmYXVsdExhbWJkYUV4ZWN1dGlvblBvbGljeSA/PyBmYWxzZVxuICAgICAgICAgICAgICAgID8gW11cbiAgICAgICAgICAgICAgICA6IFtcbiAgICAgICAgICAgICAgICAgICAgICBzaGFyZWRJbmZyYUNsaWVudC52cGNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPyBhZ3NMYW1iZGFWUENBY2Nlc3NFeGVjdXRpb25Qb2xpY3lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiBhZ3NMYW1iZGFCYXNpY0V4ZWN1dGlvblBvbGljeSxcbiAgICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgaWYgKHByb3BzLm1hbmFnZWRQb2xpY2llcykge1xuICAgICAgICAgICAgbWFuYWdlZFBvbGljaWVzLnB1c2goLi4ucHJvcHMubWFuYWdlZFBvbGljaWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE9uZSBMYW1iZGEgRnVuY3Rpb24gaXMgYnkgZGVmYXVsdCBwcm92aXNpb25lZFxuICAgICAgICB0aGlzLmxhbWJkYUV4ZWN1dGlvblJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0V4ZWN1dGlvblJvbGUnLCB7XG4gICAgICAgICAgICAuLi4ocHJvcHMuaWFtUm9sZU5hbWUgJiYgeyByb2xlTmFtZTogcHJvcHMuaWFtUm9sZU5hbWUgfSksXG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgTGFtYmRhIGV4ZWN1dGlvbiByb2xlIGZvciAke3NlcnZpY2Uuc2VydmljZU5hbWV9LSR7aWR9YCxcbiAgICAgICAgICAgIG1hbmFnZWRQb2xpY2llcyxcbiAgICAgICAgICAgIGlubGluZVBvbGljaWVzOiBpbmxpbmVQb2xpY2llcyxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGFtYmRhRXhlY3V0aW9uUm9sZS5hZGRUb1BvbGljeShhbGxvd1NTTVBhcmFtQWNjZXNzKTtcblxuICAgICAgICAvLyB0YWcgdGhlIGxhbWJkYSBleGVjdXRpb24gcm9sZSB3aXRoIHNlcnZpY2UgbmFtZSAoYWdhaW4pIGZvciBhdHRyaWJ1dGUgYmFzZWQgYWNjZXNzIGNvbnRyb2xcbiAgICAgICAgY2RrLlRhZ3Mub2YodGhpcy5sYW1iZGFFeGVjdXRpb25Sb2xlKS5hZGQoJ2FnczpzZXJ2aWNlJywgc2VydmljZS5zZXJ2aWNlTmFtZSk7XG5cbiAgICAgICAgLy8gc2VjdXJpdHkgZ3JvdXBzXG4gICAgICAgIGNvbnN0IHNlY3VyaXR5R3JvdXBzID0gKHByb3BzLnNlY3VyaXR5R3JvdXBzID8/IFtdKS5zbGljZSgpO1xuICAgICAgICBjb25zdCBzdWJuZXRTZWN1cml0eUdyb3VwcyA9XG4gICAgICAgICAgICBzaGFyZWRJbmZyYUNsaWVudC5nZXRTdWJuZXRTZWN1cml0eUdyb3VwcyhzdWJuZXRHcm91cCk7XG4gICAgICAgIC8vIGFwcGVuZCBzdWJuZXQgc2VjdXJpdHkgZ3JvdXBzXG4gICAgICAgIGlmIChzdWJuZXRTZWN1cml0eUdyb3Vwcykge1xuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHMucHVzaCguLi5zdWJuZXRTZWN1cml0eUdyb3Vwcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXBsYWNlIHNlY3VyaXR5R3JvdXBzIGluIGxhbWJkYSBpZiBzdWJuZXRTZWN1cml0eUdyb3VwIGlzIGZvdW5kXG4gICAgICAgIGNvbnN0IGxhbWJkYVByb3BzID1cbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzLmxlbmd0aCA9PT0gMCA/IHByb3BzIDogeyAuLi5wcm9wcywgc2VjdXJpdHlHcm91cHMgfTtcblxuICAgICAgICB0aGlzLmxhbWJkYUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnTGFtYmRhRnVuY3Rpb24nLCB7XG4gICAgICAgICAgICAuLi5sYW1iZGFQcm9wcyxcbiAgICAgICAgICAgIHJvbGU6IHRoaXMubGFtYmRhRXhlY3V0aW9uUm9sZSxcbiAgICAgICAgICAgIC8vIGxhbWJkYSB1c2Ugb3B0aW9uYWwgQ3VzdG9tZXIgS01TIGtleSBhcyBpbiBtb3N0IG9mIHRoZSBjYXNlLFxuICAgICAgICAgICAgLy8gZW52aXJvbm1lbnRFbmNyeXB0aW9uIGNhbiB1c2UgQVdTIG1hbmFnZWQgS2V5IGluc3RlYWQgb2YgY3VzdG9lbXIgS01TIEtleS5cbiAgICAgICAgICAgIGVudmlyb25tZW50RW5jcnlwdGlvbjogc2VydmljZS5nZXRPcHRpb25hbEtNU0tleShpZCksXG4gICAgICAgICAgICB2cGM6IHNoYXJlZEluZnJhQ2xpZW50LnZwYyxcbiAgICAgICAgICAgIHZwY1N1Ym5ldHM6IHNoYXJlZEluZnJhQ2xpZW50LmdldFN1Ym5ldHNCeUdyb3VwTmFtZShzdWJuZXRHcm91cCksXG4gICAgICAgICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==