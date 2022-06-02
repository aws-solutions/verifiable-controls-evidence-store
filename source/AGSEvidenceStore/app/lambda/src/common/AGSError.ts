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
import { BasicHttpError } from '@apjsb-serverless-lib/common-types';
export default class AGSError extends BasicHttpError {
    /**
     * Application can specify the http status code and whether the request can be
     * retried by using this extended Error interface. Here is an example to throw
     * an error which has 501 http status code and is non-retryable:
     *
     * throw new AGSError('some error message', 501, false)
     */
    constructor(message?: string, statusCode?: number, retryable?: boolean) {
        super(statusCode || 200, message, retryable);
        super.name = 'AGSError';
    }
}
