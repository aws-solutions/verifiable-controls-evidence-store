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
import {
    base64ToBase64Url,
    base64UrltoBase64,
    computeHash,
} from 'src/services/CryptoHelper';

describe('CryptoHelper tests', () => {
    test('can compute hash', () => {
        // act
        const hash = computeHash('my-input');
        const hash2 = computeHash('my-input');

        // assert
        expect(hash).not.toBeUndefined();
        expect(hash).toBe(hash2);
    });

    test('can convert between base64 and base64url', () => {
        // arrange
        const input = computeHash('my-input');

        // act
        const base64Url = base64ToBase64Url(input);
        const base64 = base64UrltoBase64(base64Url);

        // assert
        expect(input).toBe(base64);
        expect(base64Url).not.toBeUndefined();
    });
});
