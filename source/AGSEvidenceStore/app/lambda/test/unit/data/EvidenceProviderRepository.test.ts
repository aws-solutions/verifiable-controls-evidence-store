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
import 'reflect-metadata';

import * as aws from 'aws-sdk';
import * as awsmock from 'aws-sdk-mock';

import { instance, mock, when } from 'ts-mockito';

import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import { EvidenceProviderRepository } from 'src/data/EvidenceProviderRepository';
import { PutItemInput } from 'aws-sdk/clients/dynamodb';
import { EvidenceProviderData } from 'src/data/schemas/EvidenceProviderData';

describe.skip('EvidenceProviderRepository tests', () => {
    awsmock.setSDKInstance(aws);
    const appConfig: AppConfiguration = mock(AppConfiguration);

    test('can create a new evidence provider', async () => {
        // arrange
        const input: EvidenceProviderData = {
            providerId: '1234',
            createdTimestamp: new Date(Date.now()).toISOString(),
            enabled: true,
            name: 'test',
            apiKeyHash: 'myApiKey',
            schemaIds: [],
        };
        when(appConfig.evidenceProviderTableName).thenReturn('evidence-providers');
        awsmock.mock(
            'DynamoDB.DocumentClient',
            'put',
            (params: PutItemInput, callback: () => void) => {
                callback();
            }
        );
        const repo = new EvidenceProviderRepository(
            new aws.DynamoDB.DocumentClient({ region: 'ap-southeast-2' }),
            instance(appConfig)
        );

        // act
        const provider = await repo.createEvidenceProvider(input);

        // assert
        expect(provider).not.toBeUndefined();
        expect(provider.providerId).toBe('1234');
        expect(provider.enabled).toBe(true);
        expect(provider.name).toBe('test');
        expect.assertions(4);
    });
});
