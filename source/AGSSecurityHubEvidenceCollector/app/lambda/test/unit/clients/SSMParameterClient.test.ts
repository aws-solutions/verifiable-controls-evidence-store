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
import { SSMParameterClient } from 'src/clients/SSMParameterClient';
import { getParameterResponse } from 'test/__mocks__/@aws-sdk/client-ssm';

describe('SSM parameter client tests', () => {
    beforeEach(() => {
        //@ts-ignore
        SSMParameterClient._instance = undefined;
        getParameterResponse.mockClear();
    });

    test('two ssmParameterClient objects are equal', async () => {
        getParameterResponse.mockResolvedValue({ Parameter: { Value: 'localhost' } });
        const ssmParameterClient1 = SSMParameterClient.getInstance();
        const ssmParameterClient2 = SSMParameterClient.getInstance();

        expect(ssmParameterClient1).toBe(ssmParameterClient2);
    });

    test('can get evidence store api', async () => {
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'http://localhost' },
        });
        const ssmParameterClient = SSMParameterClient.getInstance();

        const api = await ssmParameterClient.getStringParameterValue('thisParam');

        expect(api).toBe('http://localhost');
        expect(getParameterResponse).toBeCalledTimes(1);
    });

    test('ssmClient is invoked once when getting evidence store api twice', async () => {
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'http://localhost' },
        });
        const ssmParameterClient = SSMParameterClient.getInstance();

        const api1 = await ssmParameterClient.getStringParameterValue('thisParam');
        const api2 = await ssmParameterClient.getStringParameterValue('thisParam');

        expect(api1).toBe('http://localhost');
        expect(api2).toBe('http://localhost');
        expect(getParameterResponse).toBeCalledTimes(1);
    });

    test('can get product arns source list', async () => {
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'macie$,guardduty$' },
        });
        const ssmParameterClient = SSMParameterClient.getInstance();

        const api = await ssmParameterClient.getStringListParameterValue('thisParam');

        expect(api).toStrictEqual(['macie$', 'guardduty$']);
        expect(getParameterResponse).toBeCalledTimes(1);
    });

    test('ssmClient is invoked once when getting product arns source list twice', async () => {
        getParameterResponse.mockResolvedValueOnce({
            Parameter: { Value: 'macie$,guardduty$' },
        });
        const ssmParameterClient = SSMParameterClient.getInstance();

        const api1 = await ssmParameterClient.getStringListParameterValue('thisParam');
        const api2 = await ssmParameterClient.getStringListParameterValue('thisParam');

        expect(api1).toStrictEqual(['macie$', 'guardduty$']);
        expect(api2).toStrictEqual(['macie$', 'guardduty$']);
        expect(getParameterResponse).toBeCalledTimes(1);
    });

    test('throws error if parameter does not have a value', async () => {
        getParameterResponse.mockResolvedValueOnce({});
        const ssmParameterClient = SSMParameterClient.getInstance();
        const task = () => ssmParameterClient.getStringParameterValue('thisParam');

        await expect(task).rejects.toThrowError();
    });

    test('throws error if parameter list does not have a value', async () => {
        getParameterResponse.mockResolvedValueOnce({});
        const ssmParameterClient = SSMParameterClient.getInstance();
        const task = () => ssmParameterClient.getStringListParameterValue('thisParam');

        await expect(task).rejects.toThrowError();
    });

    test('throws error if call to ssm fails', async () => {
        getParameterResponse.mockReturnValueOnce(Promise.reject(true));
        const ssmParameterClient = SSMParameterClient.getInstance();
        const task = () => ssmParameterClient.getStringParameterValue('thisParam');

        await expect(task).rejects.toThrowError();
    });

    test('list call throws error if call to ssm fails', async () => {
        getParameterResponse.mockReturnValueOnce(Promise.reject(true));
        const ssmParameterClient = SSMParameterClient.getInstance();
        const task = () => ssmParameterClient.getStringListParameterValue('thisParam');

        await expect(task).rejects.toThrowError();
    });
});
