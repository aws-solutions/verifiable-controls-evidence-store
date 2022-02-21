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
import fetchApiEndpoints from './index';
import { UserCredential } from '../../types';

const result = jest.fn();
jest.mock('aws-sdk', () => ({
    Credentials: jest.fn(),
    SSM: class {
        constructor(public readonly options: any) {}
        getParametersByPath() {
            return {
                promise: result,
            };
        }
    },
}));

const userCredential: UserCredential = {
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    region: 'ap-southeast-1',
};
describe('fetchApiEndpoints', () => {
    test('fetch', async () => {
        result.mockResolvedValueOnce({
            Parameters: [
                {
                    Name: '/ags/endpoints/TestService1',
                    Value: 'http://testservice1',
                },
            ],
        });
        await expect(fetchApiEndpoints(userCredential)).resolves.toEqual({
            TestService1: 'http://testservice1',
        });
    });

    test('fetch multiple page', async () => {
        result
            .mockResolvedValueOnce({
                Parameters: [
                    {
                        Name: '/ags/endpoints/TestService1',
                        Value: 'http://testservice1',
                    },
                ],
                NextToken: '123',
            })
            .mockResolvedValueOnce({
                Parameters: [
                    {
                        Name: '/ags/endpoints/TestService2',
                        Value: 'http://testservice2',
                    },
                ],
            });
        await expect(fetchApiEndpoints(userCredential)).resolves.toEqual({
            TestService1: 'http://testservice1',
            TestService2: 'http://testservice2',
        });
    });

    test('fetch no endpoint', async () => {
        result.mockResolvedValueOnce({
            Parameters: [],
        });

        await expect(fetchApiEndpoints(userCredential)).rejects.toEqual(
            new Error("Can't find ApiEndpoints from backend.")
        );
    });
});
