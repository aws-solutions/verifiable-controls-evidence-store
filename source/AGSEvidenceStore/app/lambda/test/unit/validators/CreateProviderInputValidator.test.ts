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
import { CreateProviderInputValidator } from 'src/validators/CreateProviderInputValidator';
import { getEvent } from 'test/TestHelpers';

describe('CreateProviderInputValidator tests', () => {
    let validator = new CreateProviderInputValidator();

    afterEach(() => {
        validator = new CreateProviderInputValidator();
    });

    test('throws error if body is empty', () => {
        const task = () =>
            validator.parseAndValidate({ body: '' } as APIGatewayProxyEvent);

        expect(task).toThrow();
        expect(validator.errors.length).toBe(1);
        expect(validator.errors[0]).toBe('Request body cannot be null or empty.');
    });

    test('throws error if body contains invalid json', () => {
        const task = () =>
            validator.parseAndValidate({
                body: '[    "test" : 123]',
            } as APIGatewayProxyEvent);

        expect(task).toThrow();
        expect(validator.errors.length).toBe(1);
        expect(validator.errors[0]).toBe('Request body contains invalid JSON.');
    });

    test('throws error if name is empty', () => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({
                    name: '  ',
                    schemas: [
                        {
                            schemaId: 'test',
                            content: { valid: true },
                        },
                    ],
                })
            );

        expect(task).toThrow();
        expect(validator.errors.length).toBe(2); // empty and regex error
    });

    test('throws error if schema id is invalid', () => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({ name: 'my-provider', schemas: [{ schemaId: '' }] })
            );

        expect(task).toThrow();
        expect(validator.errors.length).toBe(3);
    });

    test('throws error if input is too long', () => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({
                    providerId:
                        'a_sldkfjas-lkdjfas-ldfkja-sldfkja_sldkfja-sdlkfja_sldkfjas-ldkfj',
                    name: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
                    schemas: [
                        {
                            schemaId: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
                            content: {
                                test: true,
                            },
                        },
                    ],
                })
            );

        expect(task).toThrow();
        expect(validator.errors.length).toBe(5); //id too long, name too long, name has space, schema too long, schema has space
    });

    test('throws error if no schemas', () => {
        const task = () =>
            validator.parseAndValidate(
                getEvent({
                    name: 'test-authority',
                })
            );

        expect(task).toThrow();
        expect(validator.errors.length).toBe(1);
    });

    test.each([
        ['validname', '!!!'],
        ['!!!', 'validId_-'],
    ])(
        'throws error if name or id contains special characters',
        (name: string, id: string) => {
            const task = () =>
                validator.parseAndValidate(
                    getEvent({
                        name,
                        providerId: id,
                        schemas: [
                            {
                                schemaId: 'test',
                                content: JSON.stringify({ valid: true }),
                            },
                        ],
                    })
                );

            expect(task).toThrow();
            expect(validator.errors.length).toBe(1);
        }
    );

    test('returns validated input', () => {
        const input = validator.parseAndValidate(
            getEvent({
                name: 'test-authority',
                schemas: [{ schemaId: '123', content: { type: 'string' } }],
            })
        );

        expect(input).toBeDefined();
        expect(input.name).toBe('test-authority');
        expect(input.schemas?.length).toBe(1);
    });

    test('accepts name with space', () => {
        const input = validator.parseAndValidate(
            getEvent({
                name: 'test authority -_new',
                schemas: [{ schemaId: '123', content: { type: 'string' } }],
            })
        );

        expect(input).toBeDefined();
        expect(input.name).toBe('test authority -_new');
        expect(input.schemas?.length).toBe(1);
    });
});
