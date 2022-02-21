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
import * as ssm from '@aws-sdk/client-ssm';
import { baseSdkClientConfig, createXRayEnabledClient } from '../common/SdkClient';

export class SSMParameterClient {
    private static _instance: SSMParameterClient | undefined;

    private ssmStringParamsMap: Record<string, string>;

    private ssmClient: ssm.SSMClient;

    private constructor() {
        this.ssmClient = createXRayEnabledClient(
            new ssm.SSMClient({ ...baseSdkClientConfig })
        );
        this.ssmStringParamsMap = {};
    }

    public static getInstance(): SSMParameterClient {
        if (!SSMParameterClient._instance) {
            SSMParameterClient._instance = new SSMParameterClient();
        }
        return SSMParameterClient._instance;
    }

    async getStringListParameterValue(paramName: string): Promise<string[]> {
        const paramString = await this.getStringParameterValue(paramName);
        return paramString.split(',');
    }

    async getStringParameterValue(paramName: string): Promise<string> {
        if (this.ssmStringParamsMap[paramName]) {
            return this.ssmStringParamsMap[paramName] || '';
        }

        const command = new ssm.GetParameterCommand({
            Name: paramName,
        });

        try {
            const response = await this.ssmClient.send(command);
            const value = response?.Parameter?.Value;

            if (!value)
                throw new Error(
                    `String value not available in SSM parameter ${paramName}`
                );

            this.ssmStringParamsMap[paramName] = value;
            return value;
        } catch (error) {
            console.error(error);
            throw new Error(`Error while attempting to get SSM parameter ${paramName}`);
        }
    }
}
