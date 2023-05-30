# `@ags-cdk/ags-solution-metrics`

AWS Solutions team collects anonymous operational metrics from solutions using metrics collection API, to gain insight into operational usage of the solution after it has been deployed by customers. The metrics to be collected are custom-defined for each solution, and include aggregate anonymous data used to measure the solution’s value proposition. CloudFormation parameters captured include a subset of input parameters that are pre-set (e.g. dropdown menus) and not include free-form text parameters that might include customer data. Please see [Operational Metrics](https://w.amazon.com/bin/view/AWS/Solutions/SolutionsTeam/Metrics/Operational-Metrics) for more details.

Under the hood, this component is implemented as a CDK Customer Resource construct which is backed by a Lambda function. The Lambda function is triggered upon the the deployment, update or delete action on the CloudFormation stack that contains this Customer Resource. This construct returns a unique identifier in UUID format which identifies a particular solution deployment. This unique identifier can be retrieved from the construct through the field anonymousDataUUID. The unique identifier should be used by the operational environment if there is a need to collect the operational metrics. This construct can also support a deployment into VPC through the parameter vpc and vpcSubnets.

To opt out this feature, the user should explicitely configure the cdk context field sendAnonymousMetric to be 'No'. 

## Usage

```typescript
const app = new cdk.App();

export class HelloCdkStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const sendAnonymousMetrics =
            this.node.tryGetContext('sendAnonymousMetrics') === 'No' ? 'No' : 'Yes';

        const metricsCollector = new SolutionMetricsCollectorConstruct(
            this,
            'metrics-collector',
            {
                solutionId: 'SO19222',
                solutionDisplayName: 'Test Solution',
                sendAnonymousMetrics,
                version: 'v1.0.1',
                metricsData: {
                    metricA: 'ABC',
                    metricB: 'DDD',
                },
            }
        );
        new CfnOutput(this, 'anonymousDataUUID', {
            value: metricsCollector.anonymousDataUUID,
        });
    }
}

new HelloCdkStack(app, 'HelloCdkStack');

```
