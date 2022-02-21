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
import { CreateEvidenceProviderInput } from 'src/types/CreateEvidenceProviderInput';
import { InputValidator } from './InputValidator';

export class CreateProviderInputValidator extends InputValidator<CreateEvidenceProviderInput> {
    protected validate(input: CreateEvidenceProviderInput): void {
        const validId = /^[a-zA-Z0-9-_]+$/;
        const validName = /^[a-zA-Z]([\w -]*[a-zA-Z])?$/;

        if (input.providerId && input.providerId.length > 36) {
            this.errors.push('providerId must not exceed 36 characters in length.');
        }

        if (this.isBlank(input.name)) {
            this.errors.push('Name cannot be null or empty.');
        }

        if (!validName.test(input.name)) {
            this.errors.push(
                'Name must match /^[a-zA-Z0-9-_]+$/ pattern, only alphanumeric - and _ are acceptable characters.'
            );
        }

        if (input.providerId && !validId.test(input.providerId)) {
            this.errors.push(
                'ProviderId must match /^[a-zA-Z0-9-_]+$/ pattern, only alphanumeric - and _ are acceptable characters.'
            );
        }

        if (input.name && input.name.length > 128) {
            this.errors.push('Name must not exceed 128 characters in length');
        }

        if (input.description && input.description.length > 128) {
            this.errors.push('Description must not exceed 128 characters in length');
        }

        if (!input.schemas || input.schemas.length < 1) {
            this.errors.push('Provider must have at least 1 schema');
        }

        if (input.schemas) {
            input.schemas.forEach((s) => {
                if (!s.content) {
                    this.errors.push('Schema content cannot be null or empty.');
                }

                if (this.isBlank(s.schemaId)) {
                    this.errors.push('SchemaId cannot be null or empty.');
                }

                if (!validId.test(s.schemaId)) {
                    this.errors.push(
                        'SchemaId must match /^[a-zA-Z0-9-_]+$/ pattern, only alphanumeric - and _ are acceptable characters.'
                    );
                }

                if (s.schemaId.length > 128) {
                    this.errors.push('SchemaId must not exceed 128 characters in length');
                }
            });
        }
    }
}
