"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextLoggingMiddleware = void 0;
const logger_factory_1 = require("./logger-factory");
function ContextLoggingMiddleware(applicationName, rootContainer, runningLocally, logLevel, additionalMetadata) {
    return {
        before: (handler, next) => {
            /* istanbul ignore next */
            const logMetadata = {
                ...additionalMetadata,
                applicationName: (_e, _c) => applicationName,
                resource: (e, _c) => e.resource,
                httpMethod: (e, _c) => e.httpMethod,
                awsRequestId: (_e, c) => c.awsRequestId,
                lambdaRequestId: (e, _c) => { var _a; return (_a = e.requestContext) === null || _a === void 0 ? void 0 : _a.requestId; },
            };
            const loggerFactory = new logger_factory_1.LambdaLoggerFactory(handler.event, handler.context, runningLocally, logMetadata, logLevel);
            const loggingContextContainer = rootContainer.createChildContainer();
            loggingContextContainer.registerInstance('LoggerFactory', loggerFactory);
            const loggingContext = {
                ...handler.context,
                loggingContextContainer,
            };
            handler.context = loggingContext;
            return next();
        },
        after: (handler, next) => {
            handler.context.loggingContextContainer.clearInstances();
            return next();
        },
        onError: (handler, next) => {
            handler.context.loggingContextContainer.clearInstances();
            return next();
        },
    };
}
exports.ContextLoggingMiddleware = ContextLoggingMiddleware;
//# sourceMappingURL=context-logging-middleware.js.map