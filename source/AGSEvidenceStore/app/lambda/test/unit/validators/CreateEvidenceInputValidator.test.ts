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
import { CreateEvidenceInputValidator } from 'src/validators/CreateEvidenceInputValidator';
import { getEvent } from 'test/TestHelpers';

describe('CreateEvidenceInputValidator tests', () => {
    let validator = new CreateEvidenceInputValidator();

    afterEach(() => (validator = new CreateEvidenceInputValidator()));

    test('throws error if input is invalid', () => {
        const task = () => validator.parseAndValidate(getEvent({}));

        expect(task).toThrow();
        expect(validator.errors.length).toBe(5);
    });

    test('throws error if attachment has no objectkey', () => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({
                    providerId: '604271bb-22cb-4a54-8a19-20a33c0e9c36',
                    targetId: 'evidence-demo',
                    content: {
                        succeed: true,
                    },
                    schemaId: 'test-schema',
                    attachments: [{ objectKey: '' }],
                })
            );
        expect(task).toThrow();

        expect(validator.errors.length).toBe(1);
    });

    test.each([
        ['!!!@#fsadf', false],
        ['test1234', false],
        [{ succeed: true }, true],
        [[{ suceed: true }, { succeed: false }], true],
        [['1', '2', '3'], true],
    ])('throws error if content is not json', (content: any, isValid: boolean) => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({
                    providerId: '604271bb-22cb-4a54-8a19-20a33c0e9c36',
                    targetId: 'evidence-demo',
                    content,
                    schemaId: 'test-schema',
                })
            );

        if (isValid) {
            task();
            expect(validator.errors.length).toBe(0);
        } else {
            expect(task).toThrow();

            expect(validator.errors.length).toBe(1);
        }
    });

    test('throws error if targetId contains spaces', () => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({
                    providerId: '604271bb-22cb-4a54-8a19-20a33c0e9c36',
                    targetId: 'evidence demo',
                    content: {
                        succeed: true,
                    },
                    schemaId: 'test-schema',
                })
            );
        expect(task).toThrow();

        expect(validator.errors.length).toBe(1);
    });

    test('can validate input', () => {
        const input = validator.parseAndValidate(
            getEvent({
                providerId: '604271bb-22cb-4a54-8a19-20a33c0e9c36',
                targetId: 'arn:aws:dynamodb:ap-southeast-2:123456:table/testing-123',
                content: {
                    succeed: true,
                },
                schemaId: 'test-schema',
            })
        );

        expect(input).not.toBeUndefined();
        expect(validator.errors.length).toBe(0);
    });
});
