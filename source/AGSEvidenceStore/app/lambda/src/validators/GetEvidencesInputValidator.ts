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
import { GetEvidencesInput } from 'src/types/GetEvidencesInput';
import { InputValidator } from './InputValidator';

export class GetEvidencesInputValidator extends InputValidator<GetEvidencesInput> {
    protected parse(event: APIGatewayProxyEvent): GetEvidencesInput | null {
        if (!event.body) return {};

        return super.parse(event);
    }

    protected validate(input: GetEvidencesInput): void {
        if (input.fromTimestamp && !this.isValidDate(input.fromTimestamp)) {
            this.errors.push(
                `fromTimestamp must be in ISO format, received ${input.fromTimestamp} `
            );
        }

        if (input.toTimestamp && !this.isValidDate(input.toTimestamp)) {
            this.errors.push(
                `toTimestamp must be in ISO format, received ${input.fromTimestamp} `
            );
        }

        if (input.providerId && input.providerIds) {
            this.errors.push(
                `providerId and providerIds must not be specified at the same time.`
            );
        }

        if (input.targetIds && input.targetIds.length > 0) {
            input.targetIds = input.targetIds.filter((x) => !this.isBlank(x));
        }
    }

    private isValidDate(input: string): boolean {
        const date = Date.parse(input);

        return !isNaN(date);
    }
}
