# `@ags-cdk/ags-shared-infra-client`

> TODO: description

## Usage

```
const agsSharedInfraClient = require('@ags-cdk/ags-shared-infra-client');

//dashboard and notification
const AGS_TEAM = ['team_member_A@amazon.com']
const serviceDashboard = new AgsServiceDashboard(this, 'service-dashboard', {
        apiGateway: {
            apiName: 'apiName',
            endpoints: [{ method: 'POST', resource: '/endpoint' }],
        },
        serviceName: 'serviceName',
        lambdas: [
            {
                functionName: 'functionName',
                friendlyName: 'ags-service',
            },
        ],
    });

new AgsServiceAlarms(this, 'service-alarms-construct', {
    dashboard: serviceDashboard,
    notificationTarget: AGS_TEAM,
});

// canary
 const apiCanary = new ApiCanary(this, 'api-canary', {
            apiUrl: api.api.url,
            apiId: api.api.restApiId,
            canarySourceRelativePath: '../../app/lambda/.aws-sam/build/canary/index.js',
        });

```

Python lambda template, default python version 3.9
```
import { PythonLambda } from "@ags-cdk/ags-service-template";
...
     new PythonLambda(this, "helloworld", {
      sourceCodePath: path.resolve(__dirname, "../lambda"),
      handler: "src.hello_world.app.handler",
      functionName: "hello",
    });

```