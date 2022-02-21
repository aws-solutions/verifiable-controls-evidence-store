# AWS Governance Suite (AGS) Web Client Monorepo

This monorepo includes all the react apps and package modules for AGS components.

This monorepo enables developers to test, build and package the AGS Web Client in either full suite mode or standalone mode, as well as in any combination of apps.

## Delevelopment

### Prerequisites

-   [yarn](https://classic.yarnpkg.com/en/docs/install#mac-stable)

### Commands

-   `yarn install`
    Install required dependencies for build

-   `yarn start`
    Star the AGS web client in full suite mode. This can be used as a development environment.

-   `yarn <appName>:start`
    Run a standalone AGS web client app

-   `yarn build`
    Build all the AGS web client apps and modules

-   `yarn test`
    Run jest tests in watch mode

-   `yarn test:cover`
    Run all the jest tests with testing coverage

-   `yarn lint`
    Run eslint check

-   `yarn lint:fix`
    Run eslint check and fix fixable eslint errors

-   `yarn lighthouse` (_Internal Only_)
    Run the Lighthouse web performance check against the Web Client App

-   `yarn cy:open` (_Internal Only_)
    Open the cypress test console

-   `yarn cy:run` (_Internal Only_)
    Run the cypress integration test

-   `yarn viperlight:scan` (_Internal Only_)
    Run the viperlight scan

-   `yarn scan` (_Internal Only_)
    Run the SonarQube scan

### Folder Structure

-   [**app**](./app/README.md) AGS Web Client App in full suite mode. Refer to the README page in the folder for more details.
-   [**apps**](./apps/README.md) Standalone AGS Web Client Apps. Refer to the README page in the folder for more details.
-   [**packages**](./packages/README.md) AGS Web Client modules. Refer to the README page in the folder for more details.
-   **jest** Jest tests configuration
-   **pipeline** CI/CD Pipeline CDK app
-   **scripts** CI/CD build scripts or utils
-   **cypress** (_Internal Only_) Cypress intergration tests
-   **extractor** (_Internal Only_) App source code extractor
-   **lighthouse** (_Internal Only_) Lighthouse web performance check

### Development Guidelines

-   Enable code sharing via shareable modules in the packages folder
-   Keep the app lightweight and only includes app configuration in the app folder
-   Leverage configuration to override default settings to provide customization

### Add a new standalone app

To add a new standalone app domain,

1. In the _packages_ folder:

    1.1 Copy the app module, core library and view library of an existing app domain. For example, copy the _estate_, _estateCore_, _estateView_ folders.

    1.2 Change the name of the folders to reflect the new app domain.

    1.3 Update the package name in the package.json files for each folder to reflect the new app domain

    1.4 Update the content in these folders. See [README](./packages/README.md) in the packages folder for more details

    1.5 Update the config in the index.ts file in the _<appName>_ folder

2. In the _apps_ folder:

    2.1 Copy the related app folder. For instance, copy the _estate_ folders.

    2.2 Change the name of the folder to reflect the new app domain.

    2.3 Update the package name in the package.json file

    2.4 Update the content in these folder. See [README](./apps/README.md) in the apps folder for more details

3. Add an entry under the _scripts_ in the _package.json_ file:

```
"<newApp>:start": "yarn workspace @ags/webclient-app-<newApp> start",
```

4. Run `yarn <newApp>:start` and test your new app.

5. Update the ALL_APPS parameter in the [extractPackage.sh scripts](./scripts/extractPackage.sh).

### AppSettings

The project leverages configuration to setup the app and customize the app.

The Type definition for AppSettings is located at [./packages/core/types/appSettings.ts](./packages/core/types/appSettings.ts). And the appSettings parser is located at [./packages/core/utils/parseAppConfig/index.ts](./packages/core/utils/parseAppConfig/index.ts).
