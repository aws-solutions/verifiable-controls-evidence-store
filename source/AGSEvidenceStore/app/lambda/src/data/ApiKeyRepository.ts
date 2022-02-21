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
import * as aws from 'aws-sdk';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import { inject, injectable } from 'tsyringe';

@injectable()
export class ApiKeyRepository {
    constructor(
        @inject('APIGateway') private apig: aws.APIGateway,
        @inject('SSM') private ssm: aws.SSM,
        @inject('AppConfiguration') private appConfig: AppConfiguration
    ) {}

    async createApiKey(providerId: string): Promise<string> {
        const planParam = await this.ssm
            .getParameter({ Name: this.appConfig.evidenceStoreApiUsagePlanSSMParameter })
            .promise();

        if (!planParam.Parameter || !planParam.Parameter.Value) {
            throw new Error('Unable to retrieve usage plan id from SSM');
        }

        const apiKey = await this.apig
            .createApiKey({ name: providerId, enabled: true })
            .promise();

        if (!apiKey.value || !apiKey.id) {
            throw new Error(`Unable to create new api key for provider ${providerId}`);
        }

        await this.apig
            .createUsagePlanKey({
                keyId: apiKey.id,
                usagePlanId: planParam.Parameter.Value,
                keyType: 'API_KEY',
            })
            .promise();

        return apiKey.value;
    }
}
