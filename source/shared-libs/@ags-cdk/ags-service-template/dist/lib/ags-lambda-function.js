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
const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");
const lambda = require("@aws-cdk/aws-lambda");
const core_1 = require("@aws-cdk/core");
const ags_types_1 = require("./ags-types");
class AGSLambdaFunction extends cdk.Construct {
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
        core_1.Tags.of(this.lambdaExecutionRole).add('ags:service', service.serviceName);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLWxhbWJkYS1mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hZ3MtbGFtYmRhLWZ1bmN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7Ozs7Ozs7Ozs7OztFQWNFO0FBQ0YscUNBQXFDO0FBQ3JDLHdDQUF3QztBQUN4Qyw4Q0FBOEM7QUFDOUMsd0NBQXFDO0FBRXJDLDJDQUEwQztBQWMxQyxNQUFhLGlCQUFrQixTQUFRLEdBQUcsQ0FBQyxTQUFTO0lBSWhELFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBNkI7O1FBQ3ZFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUM5QixNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztRQUVwRCxNQUFNLFdBQVcsU0FBRyxLQUFLLENBQUMsV0FBVyxtQ0FBSSx1QkFBVyxDQUFDLE9BQU8sQ0FBQztRQUU3RCxnRUFBZ0U7UUFDaEUsd0VBQXdFO1FBQ3hFLG1GQUFtRjtRQUNuRix1RkFBdUY7UUFDdkYsTUFBTSw2QkFBNkIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUM7WUFDekQsVUFBVSxFQUFFO2dCQUNSLEdBQUcsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDO29CQUN6QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO29CQUN4QixNQUFNLEVBQUUsb0JBQW9CO29CQUM1QixRQUFRLEVBQUUsaUNBQWlDO2lCQUM5QyxDQUFDO2FBQ0w7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNoRCxTQUFTLEVBQUU7Z0JBQ1AsZUFBZSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsa0JBQWtCO2FB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SyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDO1FBRXZFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUM5RCxHQUFHLFdBQVc7WUFDZCxJQUFJLEVBQUUsSUFBSSxDQUFDLG1CQUFtQjtZQUM5QiwrREFBK0Q7WUFDL0QsNkVBQTZFO1lBQzdFLHFCQUFxQixFQUFFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7WUFDcEQsR0FBRyxFQUFFLGlCQUFpQixDQUFDLEdBQUc7WUFDMUIsVUFBVSxFQUFFLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLFdBQVcsQ0FBQztZQUNoRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNO1NBQ2pDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQTVIRCw4Q0E0SEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcbmltcG9ydCB7IFRhZ3MgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IEFHU1NlcnZpY2UgfSBmcm9tICcuL2Fncy1zZXJ2aWNlJztcbmltcG9ydCB7IFN1Ym5ldEdyb3VwIH0gZnJvbSAnLi9hZ3MtdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFHU0xhbWJkYUZ1bmN0aW9uUHJvcHNcbiAgICBleHRlbmRzIE9taXQ8XG4gICAgICAgIGxhbWJkYS5GdW5jdGlvblByb3BzLFxuICAgICAgICAnYWxsb3dQdWJsaWNTdWJuZXQnIHwgJ3JvbGUnIHwgJ3ZwYycgfCAndnBjU3VibmV0cydcbiAgICA+IHtcbiAgICBzZXJ2aWNlOiBBR1NTZXJ2aWNlO1xuICAgIGlhbVJvbGVOYW1lPzogc3RyaW5nO1xuICAgIG1hbmFnZWRQb2xpY2llcz86IGlhbS5NYW5hZ2VkUG9saWN5W107XG4gICAgZGlzYWJsZURlZmF1bHRMYW1iZGFFeGVjdXRpb25Qb2xpY3k/OiBib29sZWFuO1xuICAgIHN1Ym5ldEdyb3VwPzogU3VibmV0R3JvdXA7XG59XG5cbmV4cG9ydCBjbGFzcyBBR1NMYW1iZGFGdW5jdGlvbiBleHRlbmRzIGNkay5Db25zdHJ1Y3Qge1xuICAgIHB1YmxpYyByZWFkb25seSBsYW1iZGFGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuICAgIHB1YmxpYyByZWFkb25seSBsYW1iZGFFeGVjdXRpb25Sb2xlOiBpYW0uUm9sZTtcblxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQUdTTGFtYmRhRnVuY3Rpb25Qcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgICAgIGNvbnN0IHNlcnZpY2UgPSBwcm9wcy5zZXJ2aWNlO1xuICAgICAgICBjb25zdCBzaGFyZWRJbmZyYUNsaWVudCA9IHNlcnZpY2Uuc2hhcmVkSW5mcmFDbGllbnQ7XG5cbiAgICAgICAgY29uc3Qgc3VibmV0R3JvdXAgPSBwcm9wcy5zdWJuZXRHcm91cCA/PyBTdWJuZXRHcm91cC5TRVJWSUNFO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgaW5saW5lIHBvbGljeSB0byBlbmFibGUgbGFtYmRhIHRvIGNhbGwgYW55IG90aGVyIEFQSXNcbiAgICAgICAgLy8gSXQgaXMgb25seSBuZWNlc3Nhcnkgd2hlbiBhIHNlcnZpY2UgaXMgcnVubmluZyBpbiBhIGRpZmZlcmVudCBhY2NvdW50XG4gICAgICAgIC8vIGZyb20gdGVhbSBzaGFyZWQgYWNjb3VudCBhbmQgbmVlZCB0byBjYWxsIGl0cyBkZXBlbmRlbmN5IHNlcnZpY2VzIGFjcm9zcy1hY2NvdW50XG4gICAgICAgIC8vIFRoaXMgaXMgYSB3aWxkY2FyZCBwb2xpY3kgYXMgdGhlIEFQSUdhdGV3YXkgaGFzIHJlc291cmNlIHBvbGljeSB0byBsaW1pdCB0aGUgYWNjZXNzLlxuICAgICAgICBjb25zdCBhbGxvd0Nyb3NzQWNjb3VudEFQSVBvbGljeURvYyA9IG5ldyBpYW0uUG9saWN5RG9jdW1lbnQoe1xuICAgICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgICAgIGlhbS5Qb2xpY3lTdGF0ZW1lbnQuZnJvbUpzb24oe1xuICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgICAgIEFjdGlvbjogJ2V4ZWN1dGUtYXBpOkludm9rZScsXG4gICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiAnYXJuOmF3czpleGVjdXRlLWFwaToqOio6Ki8qLyovKicsXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhbGxvd1NTTVBhcmFtQWNjZXNzID0gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgYGFybjphd3M6c3NtOiR7Y2RrLkF3cy5SRUdJT059OiR7Y2RrLkF3cy5BQ0NPVU5UX0lEfTpwYXJhbWV0ZXIvYWdzLypgLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnc3NtOkRlc2NyaWJlUGFyYW1ldGVycycsXG4gICAgICAgICAgICAgICAgJ3NzbTpHZXRQYXJhbWV0ZXInLFxuICAgICAgICAgICAgICAgICdzc206R2V0UGFyYW1ldGVySGlzdG9yeScsXG4gICAgICAgICAgICAgICAgJ3NzbTpHZXRQYXJhbWV0ZXJzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBpbmxpbmVQb2xpY2llczogUmVjb3JkPHN0cmluZywgaWFtLlBvbGljeURvY3VtZW50PiB8IHVuZGVmaW5lZCA9XG4gICAgICAgICAgICBzaGFyZWRJbmZyYUNsaWVudC5kZXBsb3ltZW50T3B0aW9ucy5kZXZlbG9wbWVudFVzZXJSb2xlXG4gICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgQWxsb3dDcm9zc0FjY291bnRBcGlQb2xpY3k6IGFsbG93Q3Jvc3NBY2NvdW50QVBJUG9saWN5RG9jLFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmIChwcm9wcy5pbml0aWFsUG9saWN5KSB7XG4gICAgICAgICAgICBjb25zdCBpbml0aWFsUG9saWN5RG9jID0gbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCh7XG4gICAgICAgICAgICAgICAgc3RhdGVtZW50czogcHJvcHMuaW5pdGlhbFBvbGljeSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoaW5saW5lUG9saWNpZXMpIHtcbiAgICAgICAgICAgICAgICBpbmxpbmVQb2xpY2llcy5DdXN0b21Qb2xpY3kgPSBpbml0aWFsUG9saWN5RG9jO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmxpbmVQb2xpY2llcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgQ3VzdG9tUG9saWN5OiBpbml0aWFsUG9saWN5RG9jLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBnZXQgQUdTIGN1c3RvbSBtYW5hZ2VkIExhbWJkYSBleGVjdXRpb24gcG9saWNpZXNcbiAgICAgICAgY29uc3QgYWdzTGFtYmRhQmFzaWNFeGVjdXRpb25Qb2xpY3kgPSBpYW0uTWFuYWdlZFBvbGljeS5mcm9tTWFuYWdlZFBvbGljeU5hbWUoXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgJ0FHU0xhbWJkYUJhc2ljRXhlY3V0aW9uUG9saWN5JyxcbiAgICAgICAgICAgICdBR1NMYW1iZGFCYXNpY0V4ZWN1dGlvblBvbGljeSdcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBhZ3NMYW1iZGFWUENBY2Nlc3NFeGVjdXRpb25Qb2xpY3kgPSBpYW0uTWFuYWdlZFBvbGljeS5mcm9tTWFuYWdlZFBvbGljeU5hbWUoXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgJ0FHU0xhbWJkYVZQQ0FjY2Vzc0V4ZWN1dGlvblBvbGljeScsXG4gICAgICAgICAgICAnQUdTTGFtYmRhVlBDQWNjZXNzRXhlY3V0aW9uUG9saWN5J1xuICAgICAgICApO1xuXG4gICAgICAgIC8vIGNvbXBvc2UgbWFuYWdlZCBwb2xpY2llc1xuICAgICAgICBjb25zdCBtYW5hZ2VkUG9saWNpZXMgPVxuICAgICAgICAgICAgcHJvcHMuZGlzYWJsZURlZmF1bHRMYW1iZGFFeGVjdXRpb25Qb2xpY3kgPz8gZmFsc2VcbiAgICAgICAgICAgICAgICA/IFtdXG4gICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgc2hhcmVkSW5mcmFDbGllbnQudnBjXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gYWdzTGFtYmRhVlBDQWNjZXNzRXhlY3V0aW9uUG9saWN5XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogYWdzTGFtYmRhQmFzaWNFeGVjdXRpb25Qb2xpY3ksXG4gICAgICAgICAgICAgICAgICBdO1xuXG4gICAgICAgIGlmIChwcm9wcy5tYW5hZ2VkUG9saWNpZXMpIHtcbiAgICAgICAgICAgIG1hbmFnZWRQb2xpY2llcy5wdXNoKC4uLnByb3BzLm1hbmFnZWRQb2xpY2llcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPbmUgTGFtYmRhIEZ1bmN0aW9uIGlzIGJ5IGRlZmF1bHQgcHJvdmlzaW9uZWRcbiAgICAgICAgdGhpcy5sYW1iZGFFeGVjdXRpb25Sb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdFeGVjdXRpb25Sb2xlJywge1xuICAgICAgICAgICAgLi4uKHByb3BzLmlhbVJvbGVOYW1lICYmIHsgcm9sZU5hbWU6IHByb3BzLmlhbVJvbGVOYW1lIH0pLFxuICAgICAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYExhbWJkYSBleGVjdXRpb24gcm9sZSBmb3IgJHtzZXJ2aWNlLnNlcnZpY2VOYW1lfS0ke2lkfWAsXG4gICAgICAgICAgICBtYW5hZ2VkUG9saWNpZXMsXG4gICAgICAgICAgICBpbmxpbmVQb2xpY2llczogaW5saW5lUG9saWNpZXMsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxhbWJkYUV4ZWN1dGlvblJvbGUuYWRkVG9Qb2xpY3koYWxsb3dTU01QYXJhbUFjY2Vzcyk7XG5cbiAgICAgICAgLy8gdGFnIHRoZSBsYW1iZGEgZXhlY3V0aW9uIHJvbGUgd2l0aCBzZXJ2aWNlIG5hbWUgKGFnYWluKSBmb3IgYXR0cmlidXRlIGJhc2VkIGFjY2VzcyBjb250cm9sXG4gICAgICAgIFRhZ3Mub2YodGhpcy5sYW1iZGFFeGVjdXRpb25Sb2xlKS5hZGQoJ2FnczpzZXJ2aWNlJywgc2VydmljZS5zZXJ2aWNlTmFtZSk7XG5cbiAgICAgICAgLy8gc2VjdXJpdHkgZ3JvdXBzXG4gICAgICAgIGNvbnN0IHNlY3VyaXR5R3JvdXBzID0gKHByb3BzLnNlY3VyaXR5R3JvdXBzID8/IFtdKS5zbGljZSgpO1xuICAgICAgICBjb25zdCBzdWJuZXRTZWN1cml0eUdyb3VwcyA9XG4gICAgICAgICAgICBzaGFyZWRJbmZyYUNsaWVudC5nZXRTdWJuZXRTZWN1cml0eUdyb3VwcyhzdWJuZXRHcm91cCk7XG4gICAgICAgIC8vIGFwcGVuZCBzdWJuZXQgc2VjdXJpdHkgZ3JvdXBzXG4gICAgICAgIGlmIChzdWJuZXRTZWN1cml0eUdyb3Vwcykge1xuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHMucHVzaCguLi5zdWJuZXRTZWN1cml0eUdyb3Vwcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXBsYWNlIHNlY3VyaXR5R3JvdXBzIGluIGxhbWJkYSBpZiBzdWJuZXRTZWN1cml0eUdyb3VwIGlzIGZvdW5kXG4gICAgICAgIGNvbnN0IGxhbWJkYVByb3BzID1cbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzLmxlbmd0aCA9PT0gMCA/IHByb3BzIDogeyAuLi5wcm9wcywgc2VjdXJpdHlHcm91cHMgfTtcblxuICAgICAgICB0aGlzLmxhbWJkYUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnTGFtYmRhRnVuY3Rpb24nLCB7XG4gICAgICAgICAgICAuLi5sYW1iZGFQcm9wcyxcbiAgICAgICAgICAgIHJvbGU6IHRoaXMubGFtYmRhRXhlY3V0aW9uUm9sZSxcbiAgICAgICAgICAgIC8vIGxhbWJkYSB1c2Ugb3B0aW9uYWwgQ3VzdG9tZXIgS01TIGtleSBhcyBpbiBtb3N0IG9mIHRoZSBjYXNlLFxuICAgICAgICAgICAgLy8gZW52aXJvbm1lbnRFbmNyeXB0aW9uIGNhbiB1c2UgQVdTIG1hbmFnZWQgS2V5IGluc3RlYWQgb2YgY3VzdG9lbXIgS01TIEtleS5cbiAgICAgICAgICAgIGVudmlyb25tZW50RW5jcnlwdGlvbjogc2VydmljZS5nZXRPcHRpb25hbEtNU0tleShpZCksXG4gICAgICAgICAgICB2cGM6IHNoYXJlZEluZnJhQ2xpZW50LnZwYyxcbiAgICAgICAgICAgIHZwY1N1Ym5ldHM6IHNoYXJlZEluZnJhQ2xpZW50LmdldFN1Ym5ldHNCeUdyb3VwTmFtZShzdWJuZXRHcm91cCksXG4gICAgICAgICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==