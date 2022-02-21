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
import { CreateEvidenceInput } from 'src/types/CreateEvidenceInput';
import { InputValidator } from './InputValidator';

export class CreateEvidenceInputValidator extends InputValidator<CreateEvidenceInput> {
    protected validate(input: CreateEvidenceInput): void {
        const validTargetId = /^\S*$/; // no space

        if (this.isBlank(input.providerId)) {
            this.errors.push('ProviderId cannot be null or empty.');
        }

        if (this.isBlank(input.schemaId)) {
            this.errors.push('SchemaId cannot be null or empty.');
        }

        if (this.isBlank(input.targetId)) {
            this.errors.push('TargetId cannot be null or empty.');
        }

        if (input.targetId && !validTargetId.test(input.targetId)) {
            this.errors.push(
                'TargetId must match /^S*$/ pattern, spaces are not allowed.'
            );
        }

        if (!input.content) {
            this.errors.push('Content cannot be null or empty.');
        }

        if (!this.isValidJson(input.content)) {
            this.errors.push('Content must contain valid JSON value.');
        }

        if (input.attachments) {
            if (input.attachments.some((x) => this.isBlank(x.objectKey))) {
                this.errors.push('Attachment object key cannot be null or empty.');
            }
        }
    }
}
