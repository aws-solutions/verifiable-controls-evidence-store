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
import * as secrets from '@aws-sdk/client-secrets-manager';
import { baseSdkClientConfig, createXRayEnabledClient } from '../common/SdkClient';

export class SecretsManagerClient {
    private static _instance: SecretsManagerClient | undefined;

    private secretNameMap: Record<string, string>;

    private smClient: secrets.SecretsManagerClient;

    private constructor() {
        this.smClient = createXRayEnabledClient(
            new secrets.SecretsManagerClient({ ...baseSdkClientConfig })
        );
        this.secretNameMap = {};
    }

    public static getInstance(): SecretsManagerClient {
        if (!SecretsManagerClient._instance) {
            SecretsManagerClient._instance = new SecretsManagerClient();
        }
        return SecretsManagerClient._instance;
    }

    async getSecretKey(secretName: string): Promise<string> {
        if (this.secretNameMap[secretName]) {
            return this.secretNameMap[secretName] || '';
        }

        const params = {
            SecretId: secretName,
        };

        const command = new secrets.GetSecretValueCommand(params);

        try {
            const response = await this.smClient.send(command);

            const secretKey = response?.SecretString;

            if (!secretKey) {
                throw new Error(`Secret with name ${secretName} is empty.`);
            }
            this.secretNameMap[secretName] = secretKey;
            return secretKey;
        } catch (error) {
            console.error(error);
            throw new Error(
                `Error while attempting to get secret value using the GetSecretValueCommand`
            );
        }
    }
}
