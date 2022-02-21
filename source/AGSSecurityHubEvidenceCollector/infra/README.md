# AGS Example Service Infra

This defines aws resource/infra layout for the app.
By default, it consists of following component:

-   api-gateway
-   lambda

# Run/Test against isengard account

Prerequisite (Not needed if steps were followed from pipeline's README)

-   Make sure AWS account is correctly setup in local (~/.aws/config) to run against target isengard account
-   Run 'npm run cdk bootstrap' from infra folder
    -   _Note_: this requires CDK to be bootstapped with modern template, so it is important to run bootstrap inside this folder with `npm run' command.
        (https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html#bootstrapping-templates)
    -   If you were going to run it using cdk installed globally (version has to be higher than 1.25.0), use following command
        ```
        export CDK_NEW_BOOTSTRAP=1
        cdk bootstrap
        ```

From top level folder,

-   `cd app/lambda && npm ci`
-   `cd infra && npm ci`
-   `npm run build:app` build lambda
-   `npm run build:infra` build and synth infra cdk

From infra folder,

-   `npm run cdk deploy` deploy infra to target account (this is to deploy without CI/CD pipeline)
