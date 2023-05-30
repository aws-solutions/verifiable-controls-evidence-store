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
import * as crypto from 'crypto';
import * as base64url from 'base64url';

export function computeHash(
    input: string,
    encoding: 'base64' | 'base64url' = 'base64'
): string {
    const hash = crypto.createHash('sha256');

    hash.update(input);

    const hashValue = hash.digest().toString('base64');

    return encoding === 'base64url' ? base64url.default.fromBase64(hashValue) : hashValue;
}

export function base64ToBase64Url(input: string): string {
    return base64url.default.fromBase64(input);
}

export function base64UrltoBase64(input: string): string {
    return base64url.default.toBuffer(input).toString('base64');
}
