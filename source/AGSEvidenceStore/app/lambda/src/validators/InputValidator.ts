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
import { APIGatewayProxyEvent } from 'aws-lambda';
import AGSError from 'src/common/AGSError';

/**
 * @apiDefine InvalidParams
 * @apiError (Error 400 - Bad Request) {String} error Error message.
 * @apiError (Error 400 - Bad Request) {Boolean} retryable Flag indicating whether the request can be retried.
 * @apiErrorExample {json} Error-Response-400
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "The field cannot be null or empty.",
 *          "retryable": false
 *      }
 */

/**
 * @apiDefine ResourceNotFound
 * @apiError (Error 404 - Not Found) {String} error Error message.
 * @apiError (Error 404 - Not Found) {Boolean} retryable Flag indicating whether the request can be retried.
 * @apiErrorExample {json} Error-Response-404
 *      HTTP/1.1 404 Not Found
 *      {
 *          "error": "The requested resource cannot be found.",
 *          "retryable": false
 *      }
 */

/**
 * @apiDefine InternalError
 * @apiError (Error 500 - Internal Server Error) {String} error Error message.
 * @apiError (Error 500 - Internal Server Error) {Boolean} retryable Flag indicating whether the request can be retried.
 * @apiErrorExample {json} Error-Response-500
 *      HTTP/1.1 500 Internal Server Error
 *      {
 *          "error": "Connection refused.",
 *          "retryable": true
 *      }
 */
export abstract class InputValidator<T> {
    public readonly errors: string[] = [];

    parseAndValidate(event: APIGatewayProxyEvent): T {
        const body = this.parse(event);

        if (body) {
            this.validate(body);
            if (this.errors.length > 0) {
                throw new AGSError(this.errors.join(', '), 400, false);
            }
            return body;
        }

        throw new AGSError(this.errors.join(', '), 400, false);
    }

    protected parse(event: APIGatewayProxyEvent): T | null {
        try {
            if (!event.body) {
                this.errors.push('Request body cannot be null or empty.');
                return null;
            }
            return <T>JSON.parse(event.body.toString());
        } catch (error) {
            this.errors.push('Request body contains invalid JSON.');
            return null;
        }
    }

    protected abstract validate(input: T): void;

    protected isBlank(input?: string): boolean {
        return !input || /^\s*$/.test(input);
    }

    protected isValidJson(input?: any): boolean {
        try {
            if (!input) {
                return false;
            }

            if (typeof input === 'string') {
                return input && JSON.parse(input.toString());
            }

            return typeof input === 'object';
        } catch (_) {
            console.log(_);
            return false;
        }
    }
}
