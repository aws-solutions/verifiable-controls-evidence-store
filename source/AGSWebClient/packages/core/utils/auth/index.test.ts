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

import { clearSecurityToken, logout, getUserCredentials } from './index';

describe('auth', () => {
    beforeAll(() => {
        global.Storage.prototype.removeItem = jest.fn();
        global.Storage.prototype.getItem = jest.fn();
    });

    beforeEach(() => {
        (global.Storage.prototype.removeItem as jest.Mock<any>).mockClear();
        (global.Storage.prototype.getItem as jest.Mock<any>).mockClear();
    });
    afterAll(() => {
        (global.Storage.prototype.removeItem as jest.Mock<any>).mockReset();
        (global.Storage.prototype.getItem as jest.Mock<any>).mockReset();
    });

    test('clearSecurityToken', () => {
        expect(clearSecurityToken()).toBe(undefined);
        expect(global.Storage.prototype.removeItem).toBeCalledTimes(1);
        expect(global.Storage.prototype.removeItem).toBeCalledWith('awsCredentials');
    });

    test('logout', () => {
        expect(logout()).toBe(undefined);
        expect(global.Storage.prototype.removeItem).toBeCalledTimes(2);
        expect(global.Storage.prototype.removeItem).toHaveBeenNthCalledWith(
            1,
            'awsCredentials'
        );
        expect(global.Storage.prototype.removeItem).toHaveBeenNthCalledWith(
            2,
            'loginInfo'
        );
    });

    test('getUserCredentials', () => {
        (global.Storage.prototype.getItem as jest.Mock<any>).mockReturnValue(
            '{"value":"testValue"}'
        );
        expect(getUserCredentials()).toEqual({
            value: 'testValue',
        });
        expect(global.Storage.prototype.getItem).toBeCalledTimes(1);
        expect(global.Storage.prototype.getItem).toBeCalledWith('awsCredentials');
    });

    test('getUserCredentials negative', () => {
        (global.Storage.prototype.getItem as jest.Mock<any>).mockReturnValue(undefined);
        expect(getUserCredentials()).toEqual(null);
        expect(global.Storage.prototype.getItem).toBeCalledTimes(1);
        expect(global.Storage.prototype.getItem).toBeCalledWith('awsCredentials');
    });
});
