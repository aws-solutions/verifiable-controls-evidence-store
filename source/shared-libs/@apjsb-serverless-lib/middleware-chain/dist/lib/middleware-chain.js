"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareChain = void 0;
const core_1 = __importDefault(require("@middy/core"));
class MiddlewareChain {
    constructor(asyncHandlerObj, middlewares) {
        const middyHandler = core_1.default(asyncHandlerObj.handle.bind(asyncHandlerObj));
        middyHandler.use(middlewares);
        this.lambdaHandler = (event, context) => middyHandler(event, context, null);
    }
}
exports.MiddlewareChain = MiddlewareChain;
//# sourceMappingURL=middleware-chain.js.map