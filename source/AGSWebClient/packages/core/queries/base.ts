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
import { ExpiredTokenException } from './types';

export class Base {
    transformError(e: any) {
        // error handling to detect the error that caused by expire credentials
        // and throw ExpiredTokenException
        if (
            e.response &&
            e.response.status === 403 &&
            (e.response.data.message ===
                'The security token included in the request is expired' ||
                e.response.data.message ===
                    'The security token included in the request is invalid')
        ) {
            console.log('throw Security Token expired error');
            return new ExpiredTokenException('Security Token expired');
        }

        // rethrow other backend errors
        if (e.response && e.response.status && e.response.data.message) {
            console.log('throw backend errors');
            return new Error(e.response.data.message);
        }

        // rethrow a new Error by extracting the error message from AGS specific error response
        if (e.response?.data?.error) {
            console.log('throw AGS specific errors');
            return new Error(e.response.data.error);
        }

        // rethrow if error has a message
        if (e.message) {
            console.log('throw error with an message');
            return new Error(e.message);
        }

        // if it is a normal Error objcet, rethrow it
        console.log('throw unknown error');
        return e;
    }
}
