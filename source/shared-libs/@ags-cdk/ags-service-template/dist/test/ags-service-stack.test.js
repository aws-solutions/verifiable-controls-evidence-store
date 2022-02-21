"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const assert_1 = require("@aws-cdk/assert");
const cdk = require("@aws-cdk/core");
const ags_service_1 = require("../lib/ags-service");
const ags_lambda_function_1 = require("../lib/ags-lambda-function");
const ags_types_1 = require("../lib/ags-types");
const ags_rest_api_1 = require("../lib/ags-rest-api");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
class TestStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const service = new ags_service_1.AGSService(this, 'service', {
            serviceName: props.serviceProps.serviceName,
            configName: props.serviceProps.configName,
            configurations: props.serviceProps.configurations,
        });
        const lambda = new ags_lambda_function_1.AGSLambdaFunction(this, 'lambda', {
            service,
            iamRoleName: 'testrole',
            runtime: aws_lambda_1.Runtime.NODEJS_12_X,
            code: aws_lambda_1.Code.fromInline('exports.handler=async function() {}'),
            handler: 'index.handler',
        });
        new ags_rest_api_1.AGSRestApi(this, 'api', {
            service,
            lambdaFunction: lambda,
            apiExternalUserPermissions: [
                {
                    endpoints: [
                        {
                            resourcePath: 'test1/resource1',
                            httpMethod: 'POST',
                        },
                    ],
                    allowedAGSRoles: [ags_types_1.AGSRole.APPLICATION_OWNER],
                    exactMatch: true,
                },
                {
                    endpoints: [
                        {
                            resourcePath: 'test',
                            httpMethod: 'GET',
                        },
                        {
                            resourcePath: 'test1/*',
                            httpMethod: 'POST',
                        },
                    ],
                    allowedAGSRoles: [ags_types_1.AGSRole.DOMAIN_OWNER, ags_types_1.AGSRole.CONTROL_OWNER],
                },
                {
                    endpoints: [
                        {
                            resourcePath: 'test2',
                            httpMethod: 'GET',
                        },
                        {
                            resourcePath: 'test3/{id}',
                            httpMethod: 'POST',
                        },
                    ],
                    allowedAGSRoles: [ags_types_1.AGSRole.EVERYONE],
                },
            ],
        });
    }
}
test('Snapshot Test', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TestStack(app, 'stack', {
        env: { account: '12345', region: 'ap-southeast-2' },
        serviceProps: {
            serviceName: 'TestService',
            configName: 'test',
            configurations: {},
        },
    });
    // THEN
    expect(assert_1.SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlcnZpY2Utc3RhY2sudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QvYWdzLXNlcnZpY2Utc3RhY2sudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7Ozs7Ozs7OztFQWNFO0FBQ0YsNENBQTZDO0FBQzdDLHFDQUFxQztBQUNyQyxvREFBaUU7QUFDakUsb0VBQStEO0FBQy9ELGdEQUEyQztBQUMzQyxzREFBaUQ7QUFDakQsb0RBQW9EO0FBRXBELE1BQU0sU0FBVSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzdCLFlBQ0ksS0FBb0IsRUFDcEIsRUFBVSxFQUNWLEtBRWtCO1FBRWxCLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sT0FBTyxHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQzVDLFdBQVcsRUFBRSxLQUFLLENBQUMsWUFBWSxDQUFDLFdBQVc7WUFDM0MsVUFBVSxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBVTtZQUN6QyxjQUFjLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxjQUFjO1NBQ3BELENBQUMsQ0FBQztRQUVILE1BQU0sTUFBTSxHQUFHLElBQUksdUNBQWlCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUNqRCxPQUFPO1lBQ1AsV0FBVyxFQUFFLFVBQVU7WUFDdkIsT0FBTyxFQUFFLG9CQUFPLENBQUMsV0FBVztZQUM1QixJQUFJLEVBQUUsaUJBQUksQ0FBQyxVQUFVLENBQUMscUNBQXFDLENBQUM7WUFDNUQsT0FBTyxFQUFFLGVBQWU7U0FDM0IsQ0FBQyxDQUFDO1FBRUgsSUFBSSx5QkFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7WUFDeEIsT0FBTztZQUNQLGNBQWMsRUFBRSxNQUFNO1lBQ3RCLDBCQUEwQixFQUFFO2dCQUN4QjtvQkFDSSxTQUFTLEVBQUU7d0JBQ1A7NEJBQ0ksWUFBWSxFQUFFLGlCQUFpQjs0QkFDL0IsVUFBVSxFQUFFLE1BQU07eUJBQ3JCO3FCQUNKO29CQUNELGVBQWUsRUFBRSxDQUFDLG1CQUFPLENBQUMsaUJBQWlCLENBQUM7b0JBQzVDLFVBQVUsRUFBRSxJQUFJO2lCQUNuQjtnQkFDRDtvQkFDSSxTQUFTLEVBQUU7d0JBQ1A7NEJBQ0ksWUFBWSxFQUFFLE1BQU07NEJBQ3BCLFVBQVUsRUFBRSxLQUFLO3lCQUNwQjt3QkFDRDs0QkFDSSxZQUFZLEVBQUUsU0FBUzs0QkFDdkIsVUFBVSxFQUFFLE1BQU07eUJBQ3JCO3FCQUNKO29CQUNELGVBQWUsRUFBRSxDQUFDLG1CQUFPLENBQUMsWUFBWSxFQUFFLG1CQUFPLENBQUMsYUFBYSxDQUFDO2lCQUNqRTtnQkFDRDtvQkFDSSxTQUFTLEVBQUU7d0JBQ1A7NEJBQ0ksWUFBWSxFQUFFLE9BQU87NEJBQ3JCLFVBQVUsRUFBRSxLQUFLO3lCQUNwQjt3QkFDRDs0QkFDSSxZQUFZLEVBQUUsWUFBWTs0QkFDMUIsVUFBVSxFQUFFLE1BQU07eUJBQ3JCO3FCQUNKO29CQUNELGVBQWUsRUFBRSxDQUFDLG1CQUFPLENBQUMsUUFBUSxDQUFDO2lCQUN0QzthQUNKO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBRUQsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDdkIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFMUIsT0FBTztJQUNQLE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUU7UUFDdEMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUU7UUFDbkQsWUFBWSxFQUFFO1lBQ1YsV0FBVyxFQUFFLGFBQWE7WUFDMUIsVUFBVSxFQUFFLE1BQU07WUFDbEIsY0FBYyxFQUFFLEVBQUU7U0FDckI7S0FDSixDQUFDLENBQUM7SUFFSCxPQUFPO0lBQ1AsTUFBTSxDQUFDLG1CQUFVLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUNqRSxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIFxuICBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgXG4gIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIikuXG4gIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gIFxuICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gIFxuICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0IHsgU3ludGhVdGlscyB9IGZyb20gJ0Bhd3MtY2RrL2Fzc2VydCc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgeyBBR1NTZXJ2aWNlLCBBR1NTZXJ2aWNlUHJvcHMgfSBmcm9tICcuLi9saWIvYWdzLXNlcnZpY2UnO1xuaW1wb3J0IHsgQUdTTGFtYmRhRnVuY3Rpb24gfSBmcm9tICcuLi9saWIvYWdzLWxhbWJkYS1mdW5jdGlvbic7XG5pbXBvcnQgeyBBR1NSb2xlIH0gZnJvbSAnLi4vbGliL2Fncy10eXBlcyc7XG5pbXBvcnQgeyBBR1NSZXN0QXBpIH0gZnJvbSAnLi4vbGliL2Fncy1yZXN0LWFwaSc7XG5pbXBvcnQgeyBDb2RlLCBSdW50aW1lIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSc7XG5cbmNsYXNzIFRlc3RTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHNjb3BlOiBjZGsuQ29uc3RydWN0LFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgc2VydmljZVByb3BzOiBBR1NTZXJ2aWNlUHJvcHM7XG4gICAgICAgIH0gJiBjZGsuU3RhY2tQcm9wc1xuICAgICkge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICBjb25zdCBzZXJ2aWNlID0gbmV3IEFHU1NlcnZpY2UodGhpcywgJ3NlcnZpY2UnLCB7XG4gICAgICAgICAgICBzZXJ2aWNlTmFtZTogcHJvcHMuc2VydmljZVByb3BzLnNlcnZpY2VOYW1lLFxuICAgICAgICAgICAgY29uZmlnTmFtZTogcHJvcHMuc2VydmljZVByb3BzLmNvbmZpZ05hbWUsXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uczogcHJvcHMuc2VydmljZVByb3BzLmNvbmZpZ3VyYXRpb25zLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBsYW1iZGEgPSBuZXcgQUdTTGFtYmRhRnVuY3Rpb24odGhpcywgJ2xhbWJkYScsIHtcbiAgICAgICAgICAgIHNlcnZpY2UsXG4gICAgICAgICAgICBpYW1Sb2xlTmFtZTogJ3Rlc3Ryb2xlJyxcbiAgICAgICAgICAgIHJ1bnRpbWU6IFJ1bnRpbWUuTk9ERUpTXzEyX1gsXG4gICAgICAgICAgICBjb2RlOiBDb2RlLmZyb21JbmxpbmUoJ2V4cG9ydHMuaGFuZGxlcj1hc3luYyBmdW5jdGlvbigpIHt9JyksXG4gICAgICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG5ldyBBR1NSZXN0QXBpKHRoaXMsICdhcGknLCB7XG4gICAgICAgICAgICBzZXJ2aWNlLFxuICAgICAgICAgICAgbGFtYmRhRnVuY3Rpb246IGxhbWJkYSxcbiAgICAgICAgICAgIGFwaUV4dGVybmFsVXNlclBlcm1pc3Npb25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlbmRwb2ludHM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZVBhdGg6ICd0ZXN0MS9yZXNvdXJjZTEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0dHBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIGFsbG93ZWRBR1NSb2xlczogW0FHU1JvbGUuQVBQTElDQVRJT05fT1dORVJdLFxuICAgICAgICAgICAgICAgICAgICBleGFjdE1hdGNoOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlbmRwb2ludHM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZVBhdGg6ICd0ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodHRwTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VQYXRoOiAndGVzdDEvKicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHR0cE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dlZEFHU1JvbGVzOiBbQUdTUm9sZS5ET01BSU5fT1dORVIsIEFHU1JvbGUuQ09OVFJPTF9PV05FUl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGVuZHBvaW50czogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlUGF0aDogJ3Rlc3QyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodHRwTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VQYXRoOiAndGVzdDMve2lkfScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHR0cE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dlZEFHU1JvbGVzOiBbQUdTUm9sZS5FVkVSWU9ORV0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxudGVzdCgnU25hcHNob3QgVGVzdCcsICgpID0+IHtcbiAgICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG4gICAgLy8gV0hFTlxuICAgIGNvbnN0IHN0YWNrID0gbmV3IFRlc3RTdGFjayhhcHAsICdzdGFjaycsIHtcbiAgICAgICAgZW52OiB7IGFjY291bnQ6ICcxMjM0NScsIHJlZ2lvbjogJ2FwLXNvdXRoZWFzdC0yJyB9LFxuICAgICAgICBzZXJ2aWNlUHJvcHM6IHtcbiAgICAgICAgICAgIHNlcnZpY2VOYW1lOiAnVGVzdFNlcnZpY2UnLFxuICAgICAgICAgICAgY29uZmlnTmFtZTogJ3Rlc3QnLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbnM6IHt9LFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIGV4cGVjdChTeW50aFV0aWxzLnRvQ2xvdWRGb3JtYXRpb24oc3RhY2spKS50b01hdGNoU25hcHNob3QoKTtcbn0pO1xuIl19