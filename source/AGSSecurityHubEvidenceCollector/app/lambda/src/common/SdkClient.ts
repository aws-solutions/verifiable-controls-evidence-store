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
import * as xray from 'aws-xray-sdk';
import { UserAgent } from '@aws-sdk/types';

export const baseSdkClientConfig = {
    customUserAgent: [
        [process.env.SOLUTION_ID, process.env.SOLUTION_VERSION],
    ] as UserAgent,
};

export function createXRayEnabledClient<T>(client: T): T {
    return xray.captureAWSv3Client(client as any) as T;
}
