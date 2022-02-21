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
import { GetEvidencesInputValidator } from 'src/validators/GetEvidencesInputValidator';
import { getEvent } from 'test/TestHelpers';

describe('GetEvidencesInputValidator tests', () => {
    let validator = new GetEvidencesInputValidator();

    afterEach(() => {
        validator = new GetEvidencesInputValidator();
    });

    test('can validate input', () => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({
                    targetIds: [],
                    fromTimestamp: new Date().toISOString(),
                    toTimestamp: new Date().toISOString(),
                })
            );

        expect(validator.errors.length).toBe(0);
        expect(task).not.toThrow();
    });

    test('throw error if invalid fromTimestamp', () => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({ fromTimestamp: 'abcdem', toTimestamp: 'sdfsdf' })
            );

        expect(task).toThrow();
        expect(validator.errors.length).toBe(2);
    });

    test('throw error if both providerId and providersId are specified', () => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({ providerId: '1234', providerIds: ['123', '234'] })
            );

        expect(task).toThrow();
        expect(validator.errors.length).toBe(1);
    });

    test('return empty input if request has no body', () => {
        const input = validator.parseAndValidate({} as APIGatewayProxyEvent);

        expect(input).not.toBeNull();
        expect(input).not.toBeUndefined();
    });

    test('filter out blank targetIds', () => {
        const input = validator.parseAndValidate(
            getEvent({
                targetIds: ['   ', 'test', ' ', ''],
            })
        );

        expect(input.targetIds?.length).toBe(1);
        expect(input.targetIds?.[0]).toBe('test');
    });
});
