"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettyStringify = void 0;
const logger_1 = require("@apjsb-serverless-lib/logger");
/* eslint-disable-next-line */
const prettyStringify = (value) => JSON.stringify(value, null, 4);
exports.prettyStringify = prettyStringify;
const RequestLogger = (applicationLogger) => ({
    before: (handler, next) => {
        var _a, _b;
        // if the application logger is a ContextLogger, create a child logger
        // with the request info and store it in context
        if (applicationLogger instanceof logger_1.ContextLogger) {
            const newLogger = applicationLogger.getChildLogger({
                httpMethod: handler.event.httpMethod,
                resource: handler.event.resource,
                awsRequestId: handler.context.awsRequestId,
                lambdaRequestId: (_a = handler.event.requestContext) === null || _a === void 0 ? void 0 : _a.requestId,
            });
            handler.context.requestLogger = newLogger;
        }
        const requestLogger = (_b = handler.context.requestLogger) !== null && _b !== void 0 ? _b : applicationLogger;
        requestLogger.info('Request Started');
        requestLogger.debug(`Event: ${JSON.stringify(handler.event)}`);
        return next();
    },
    after: (handler, next) => {
        var _a;
        const requestLogger = (_a = handler.context.requestLogger) !== null && _a !== void 0 ? _a : applicationLogger;
        requestLogger.debug(`Response: ${JSON.stringify(handler.response)}`);
        requestLogger.info('Request Finished');
        return next();
    },
    onError: (handler, next) => {
        var _a;
        const requestLogger = (_a = handler.context.requestLogger) !== null && _a !== void 0 ? _a : applicationLogger;
        requestLogger.error(`Error: ${JSON.stringify(handler.error.message)}`);
        requestLogger.info('Request Failed');
        return next();
    },
});
exports.default = RequestLogger;
//# sourceMappingURL=index.js.map