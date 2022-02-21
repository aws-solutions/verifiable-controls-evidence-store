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
import util from 'util';

const promisify = util.promisify || require('es6-promisify').promisify;

/* eslint-disable-next-line */
export function invoke(handler: any, event = {}, context = {}): any {
    return promisify(handler)(event, context);
}

/// because AWSError is not exposed
export class AWSError implements Error {
    name: string;
    message: string;
    stack?: string | undefined;

    constructor(public code: string) {
        this.name = 'test error';
        this.message = 'test message';
    }
}

export function getEvent(body: Record<string, unknown>): APIGatewayProxyEvent {
    return { body: JSON.stringify(body) } as APIGatewayProxyEvent;
}
