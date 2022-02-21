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
import { Base } from './base';
import { ExpiredTokenException } from './types';

const base = new Base();
describe('Base', () => {
    test('error handlings', () => {
        expect(
            base.transformError({
                response: {
                    status: 403,
                    data: {
                        message: 'The security token included in the request is expired',
                    },
                },
            })
        ).toEqual(new ExpiredTokenException('Security Token expired'));

        expect(
            base.transformError({
                response: {
                    status: 400,
                    data: {
                        message: 'Test Messages',
                    },
                },
            })
        ).toEqual(new Error('Test Messages'));

        expect(
            base.transformError({
                response: {
                    data: {
                        error: 'Test Error Messages',
                    },
                },
            })
        ).toEqual(new Error('Test Error Messages'));

        expect(
            base.transformError({
                message: 'Test Error Message 1',
            })
        ).toEqual(new Error('Test Error Message 1'));

        expect(
            base.transformError({
                xyz: 'abc',
            })
        ).toEqual({
            xyz: 'abc',
        });
    });
});
