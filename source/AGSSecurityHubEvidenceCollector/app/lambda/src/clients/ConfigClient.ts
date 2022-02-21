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
import {
    ConfigServiceClient,
    BatchGetResourceConfigCommand,
    BatchGetResourceConfigCommandInput,
    BatchGetResourceConfigCommandOutput,
} from '@aws-sdk/client-config-service';
import { baseSdkClientConfig, createXRayEnabledClient } from '../common/SdkClient';
import { assumeRole } from './STSClient';

const ASSUME_ROLE_NAME = process.env.ASSUME_ROLE_NAME;

export async function getArn(
    resourceId: string,
    resourceType: string,
    accountId: string,
    region: string
): Promise<string> {
    const configClient = createXRayEnabledClient(
        new ConfigServiceClient({
            ...baseSdkClientConfig,
            region,
            credentials: await assumeRole(
                `arn:aws:iam::${accountId}:role/${ASSUME_ROLE_NAME}`,
                'SHECLambda'
            ),
        })
    );

    const batchGetResourceConfigCommand = new BatchGetResourceConfigCommand({
        resourceKeys: [{ resourceId: resourceId, resourceType: resourceType }],
    } as BatchGetResourceConfigCommandInput);
    const response: BatchGetResourceConfigCommandOutput = await configClient.send(
        batchGetResourceConfigCommand
    );

    return response?.baseConfigurationItems?.[0]?.arn ?? resourceId;
}
