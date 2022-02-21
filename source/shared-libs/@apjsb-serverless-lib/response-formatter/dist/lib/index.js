"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_types_1 = require("@apjsb-serverless-lib/common-types");
const defaultConfig = {
    headers: {},
};
const ResponseFormatter = (config = defaultConfig) => {
    const addHeaders = (handler, additonalHeaders) => {
        handler.response.headers = Object.assign(handler.response.headers || {}, additonalHeaders);
    };
    return {
        after: (handler, next) => {
            addHeaders(handler, config.headers);
            return next();
        },
        onError: (handler, next) => {
            if (handler.error instanceof common_types_1.BasicHttpError) {
                handler.response = common_types_1.BasicHttpResponse.ofError(handler.error);
                addHeaders(handler, config.headers);
                return next();
            }
            else {
                // other exceptions, respond with 500 - Internal Server Error
                handler.response = common_types_1.BasicHttpResponse.ofError(common_types_1.BasicHttpError.internalServerError(handler.error.message));
                return next();
            }
        },
    };
};
exports.default = ResponseFormatter;
//# sourceMappingURL=index.js.map