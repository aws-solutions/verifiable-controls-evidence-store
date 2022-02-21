"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolutionMetricsCollectorConstruct = void 0;
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
const lambda = require("aws-cdk-lib/aws-lambda");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cr = require("aws-cdk-lib/custom-resources");
const path = require("path");
const logs = require("aws-cdk-lib/aws-logs");
const constructs_1 = require("constructs");
class SolutionMetricsCollectorConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        var _a;
        super(scope, id);
        const metricsCollectorLambda = new lambda.Function(this, 'MetricsCollectorFunction', {
            description: `${props.solutionDisplayName} (${props.version}): metrics collection function`,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(path.resolve(__dirname, './lambda')),
            handler: 'index.lambdaHandler',
            timeout: aws_cdk_lib_1.Duration.minutes(1),
            memorySize: 128,
            environment: {
                SOLUTION_ID: props.solutionId,
                SOLUTION_VERSION: props.version,
                SOLUTION_METRIC_ENDPOINT: (_a = props.metricEndpoint) !== null && _a !== void 0 ? _a : 'https://metrics.awssolutionsbuilder.com/generic',
            },
        });
        const metricsCollectorCrProvider = new cr.Provider(this, 'metricsCollectorCrProvider', {
            onEventHandler: metricsCollectorLambda,
            logRetention: logs.RetentionDays.ONE_DAY,
        });
        new aws_cdk_lib_1.CustomResource(this, id, {
            serviceToken: metricsCollectorCrProvider.serviceToken,
            properties: {
                sendAnonymousMetric: props.sendAnonymousMetric,
                ...props.metricsData,
            },
        });
    }
}
exports.SolutionMetricsCollectorConstruct = SolutionMetricsCollectorConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29sdXRpb24tbWV0cmljcy1jb2xsZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvc29sdXRpb24tbWV0cmljcy1jb2xsZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRixpREFBaUQ7QUFDakQsNkNBQXVEO0FBQ3ZELG1EQUFtRDtBQUNuRCw2QkFBNkI7QUFDN0IsNkNBQTZDO0FBQzdDLDJDQUF1QztBQVd2QyxNQUFhLGlDQUFrQyxTQUFRLHNCQUFTO0lBQzVELFlBQ0ksS0FBZ0IsRUFDaEIsRUFBVSxFQUNWLEtBQTZDOztRQUU3QyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUM5QyxJQUFJLEVBQ0osMEJBQTBCLEVBQzFCO1lBQ0ksV0FBVyxFQUFFLEdBQUcsS0FBSyxDQUFDLG1CQUFtQixLQUFLLEtBQUssQ0FBQyxPQUFPLGdDQUFnQztZQUMzRixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNoRSxPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE9BQU8sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDNUIsVUFBVSxFQUFFLEdBQUc7WUFDZixXQUFXLEVBQUU7Z0JBQ1QsV0FBVyxFQUFFLEtBQUssQ0FBQyxVQUFVO2dCQUM3QixnQkFBZ0IsRUFBRSxLQUFLLENBQUMsT0FBTztnQkFDL0Isd0JBQXdCLFFBQ3BCLEtBQUssQ0FBQyxjQUFjLG1DQUNwQixpREFBaUQ7YUFDeEQ7U0FDSixDQUNKLENBQUM7UUFFRixNQUFNLDBCQUEwQixHQUFHLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FDOUMsSUFBSSxFQUNKLDRCQUE0QixFQUM1QjtZQUNJLGNBQWMsRUFBRSxzQkFBc0I7WUFDdEMsWUFBWSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTztTQUMzQyxDQUNKLENBQUM7UUFFRixJQUFJLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRTtZQUN6QixZQUFZLEVBQUUsMEJBQTBCLENBQUMsWUFBWTtZQUNyRCxVQUFVLEVBQUU7Z0JBQ1IsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLG1CQUFtQjtnQkFDOUMsR0FBRyxLQUFLLENBQUMsV0FBVzthQUN2QjtTQUNKLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQTdDRCw4RUE2Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCB7IEN1c3RvbVJlc291cmNlLCBEdXJhdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGNyIGZyb20gJ2F3cy1jZGstbGliL2N1c3RvbS1yZXNvdXJjZXMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU29sdXRpb25NZXRyaWNzQ29sbGVjdG9yQ29uc3RydWN0UHJvcHMge1xuICAgIHNvbHV0aW9uRGlzcGxheU5hbWU6IHN0cmluZztcbiAgICBzb2x1dGlvbklkOiBzdHJpbmc7XG4gICAgbWV0cmljRW5kcG9pbnQ/OiBzdHJpbmc7XG4gICAgdmVyc2lvbjogc3RyaW5nO1xuICAgIHNlbmRBbm9ueW1vdXNNZXRyaWM6ICdZZXMnIHwgJ05vJztcbiAgICBtZXRyaWNzRGF0YTogeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH07XG59XG5cbmV4cG9ydCBjbGFzcyBTb2x1dGlvbk1ldHJpY3NDb2xsZWN0b3JDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBzY29wZTogQ29uc3RydWN0LFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICBwcm9wczogU29sdXRpb25NZXRyaWNzQ29sbGVjdG9yQ29uc3RydWN0UHJvcHNcbiAgICApIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICBjb25zdCBtZXRyaWNzQ29sbGVjdG9yTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAnTWV0cmljc0NvbGxlY3RvckZ1bmN0aW9uJyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYCR7cHJvcHMuc29sdXRpb25EaXNwbGF5TmFtZX0gKCR7cHJvcHMudmVyc2lvbn0pOiBtZXRyaWNzIGNvbGxlY3Rpb24gZnVuY3Rpb25gLFxuICAgICAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgICAgICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9sYW1iZGEnKSksXG4gICAgICAgICAgICAgICAgaGFuZGxlcjogJ2luZGV4LmxhbWJkYUhhbmRsZXInLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICAgICAgICAgICAgbWVtb3J5U2l6ZTogMTI4LFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgICAgIFNPTFVUSU9OX0lEOiBwcm9wcy5zb2x1dGlvbklkLFxuICAgICAgICAgICAgICAgICAgICBTT0xVVElPTl9WRVJTSU9OOiBwcm9wcy52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICBTT0xVVElPTl9NRVRSSUNfRU5EUE9JTlQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5tZXRyaWNFbmRwb2ludCA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2h0dHBzOi8vbWV0cmljcy5hd3Nzb2x1dGlvbnNidWlsZGVyLmNvbS9nZW5lcmljJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IG1ldHJpY3NDb2xsZWN0b3JDclByb3ZpZGVyID0gbmV3IGNyLlByb3ZpZGVyKFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICdtZXRyaWNzQ29sbGVjdG9yQ3JQcm92aWRlcicsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgb25FdmVudEhhbmRsZXI6IG1ldHJpY3NDb2xsZWN0b3JMYW1iZGEsXG4gICAgICAgICAgICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX0RBWSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICBuZXcgQ3VzdG9tUmVzb3VyY2UodGhpcywgaWQsIHtcbiAgICAgICAgICAgIHNlcnZpY2VUb2tlbjogbWV0cmljc0NvbGxlY3RvckNyUHJvdmlkZXIuc2VydmljZVRva2VuLFxuICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgIHNlbmRBbm9ueW1vdXNNZXRyaWM6IHByb3BzLnNlbmRBbm9ueW1vdXNNZXRyaWMsXG4gICAgICAgICAgICAgICAgLi4ucHJvcHMubWV0cmljc0RhdGEsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=