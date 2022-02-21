# `@ags-cdk/ags-solution-metrics`

AWS Solutions team collects anonymous operational metrics from solutions using metrics collection API, to gain insight into operational usage of the solution after it has been deployed by customers. The metrics to be collected are custom-defined for each solution, and include aggregate anonymous data used to measure the solution’s value proposition. CloudFormation parameters captured include a subset of input parameters that are pre-set (e.g. dropdown menus) and not include free-form text parameters that might include customer data. Please see [Operational Metrics](https://w.amazon.com/bin/view/AWS/Solutions/SolutionsTeam/Metrics/Operational-Metrics) for more details.

Under the hood, this component is implemented as a CDK Customer Resource construct which is backed by a Lambda function. The Lambda function is triggered upon the the deployment, update or delete action on the CloudFormation stack that contains this Customer Resource.

## Usage

```typescript
const stack = new cdk.Stack();

const props: SolutionMetricsCollectorConstructProps = {
    version: 'V1.0.0',
    solutionId: 'SolutionXXX',
    solutionDisplayName: 'Test Solution XXX',
    sendAnonymousMetric: 'Yes',
    metricsData: {
        MetricX: 123,
        MetricY: 456,
    },
};

new SolutionMetricsCollectorConstruct(stack, 'metrics-collector-construct', props);
```
