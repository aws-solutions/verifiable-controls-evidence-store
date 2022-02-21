### AGS Web Client Modules

This project includes the source code for all the AGS UI modules.

#### Module Strcuture

There are 3 different module types:

-   `app module` (use app name as module name) is to be imported by the Web Client apps in either standalone mode, full suite mode or any custom combination way.
    -   `pages` folder includes page content for each routable page
    -   `routes` folder defines the route related to this app
    -   `index.ts` includes the app module configuration (See below the Section _App Module Configuration_).
-   `core library` (name endsWiths _Core_) is to specify the configuration, define the types and construct the API queries for an app. The _core_ library is supposed to be imported by its app or other apps that requies only the service.
    -   `config` folder includes constants, route path constans permissions and navigation templates configuration.
    -   `queries` folder includes the _react-query_ queries and mutations.
    -   `types` folder includes the Typescript type definitions related to the app domain.
-   `view library` (name endsWiths _View_) is to define the view components and container components.
    -   `components` folder includes the pure react components without any API services call
    -   `containers` folder includes standalone containers can be used as a standalone widget or form a page components.

#### App Module Configuration

See Type defintion AppModuleConfig [./core/types/appSettings.ts](./core/types/appSettings.ts) on how to configure the app module.
