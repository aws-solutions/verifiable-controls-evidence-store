"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
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
const common_types_1 = require("@apjsb-serverless-lib/common-types");
const tsyringe_1 = require("tsyringe");
class Router {
    constructor() {
        this.routes = [];
    }
    addRoute(predicate, handlerToken) {
        this.routes.push({ predicate, handlerToken: handlerToken });
        return this;
    }
    handle(event, context) {
        var _a, _b;
        const route = this.routes.find((r) => r.predicate(event));
        if (route) {
            const iocContainer = (_b = (_a = context) === null || _a === void 0 ? void 0 : _a.loggingContextContainer) !== null && _b !== void 0 ? _b : tsyringe_1.container;
            return iocContainer.resolve(route.handlerToken).handle(event, context);
        }
        return new Promise((resolve) => resolve(common_types_1.BasicHttpResponse.ofError(new common_types_1.BasicHttpError(404, `Could not find a matching route for ${event.httpMethod} ${event.resource} ${event.path}`, false))));
    }
}
exports.Router = Router;
//# sourceMappingURL=Router.js.map