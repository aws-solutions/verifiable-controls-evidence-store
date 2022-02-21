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
import { UpdateProviderInputValidator } from 'src/validators/UpdateProviderInputValidator';
import { getEvent } from 'test/TestHelpers';

describe('UpdateProviderInputValidator tests', () => {
    let validator = new UpdateProviderInputValidator();

    afterEach(() => (validator = new UpdateProviderInputValidator()));

    test('throws error if input is invalid', () => {
        const task = () => validator.parseAndValidate(getEvent({}));

        expect(task).toThrow();
        expect(validator.errors.length).toBe(2);
    });
});
