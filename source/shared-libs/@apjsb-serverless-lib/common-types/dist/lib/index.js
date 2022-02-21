"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicHttpError = exports.BasicHttpResponse = void 0;
const jsonContentTypeHeader = {
    'Content-Type': 'application/json',
};
const textContentTypeHeader = {
    'Content-Type': 'text/plain',
};
class BasicHttpResponse {
    constructor(statusCode, body = '', headers) {
        this.statusCode = statusCode;
        this.body = body;
        this.headers = headers;
    }
    addHeaders(headers) {
        this.headers = Object.assign(this.headers || {}, headers);
        return this;
    }
    static ofError(error) {
        return new BasicHttpResponse(error.statusCode, JSON.stringify({
            error: error.message,
            retryable: error.retryable,
        }), jsonContentTypeHeader);
    }
    static ofRecord(statusCode, data) {
        return new BasicHttpResponse(statusCode, JSON.stringify(data), jsonContentTypeHeader);
    }
    static ofString(statusCode, message) {
        return new BasicHttpResponse(statusCode, message, textContentTypeHeader);
    }
    static ofObject(statusCode, value) {
        return new BasicHttpResponse(statusCode, JSON.stringify(value), jsonContentTypeHeader);
    }
}
exports.BasicHttpResponse = BasicHttpResponse;
// Basic runtime error
class BasicHttpError {
    constructor(statusCode, message = '', retryable = false) {
        this.statusCode = statusCode;
        this.message = message;
        this.retryable = retryable;
        this.name = 'BasicHttpError';
    }
    static internalServerError(message) {
        return new BasicHttpError(500, message, false);
    }
}
exports.BasicHttpError = BasicHttpError;
//# sourceMappingURL=index.js.map