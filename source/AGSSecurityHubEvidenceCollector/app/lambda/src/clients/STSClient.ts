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
import * as sts from '@aws-sdk/client-sts';
import * as types from '@aws-sdk/types';
import { baseSdkClientConfig, createXRayEnabledClient } from '../common/SdkClient';

const stsClient = createXRayEnabledClient(new sts.STSClient({ ...baseSdkClientConfig }));

export async function assumeRole(
    roleArn: string,
    roleSessionName: string
): Promise<types.Credentials> {
    const params = {
        RoleArn: roleArn,
        RoleSessionName: roleSessionName,
    };
    try {
        const command = new sts.AssumeRoleCommand(params);
        const assumeRoleCommandOutput = await stsClient.send(command);
        if (!assumeRoleCommandOutput.Credentials) {
            throw Error(`Empty credentials retrieved for assume role ${roleArn}`);
        }
        return {
            accessKeyId: assumeRoleCommandOutput.Credentials.AccessKeyId!,
            secretAccessKey: assumeRoleCommandOutput.Credentials.SecretAccessKey!,
            expiration: assumeRoleCommandOutput.Credentials.Expiration,
            sessionToken: assumeRoleCommandOutput.Credentials.SessionToken,
        };
    } catch (error) {
        console.error(error);
        throw new Error(`Error while attempting to assume role ${roleArn}`);
    }
}
