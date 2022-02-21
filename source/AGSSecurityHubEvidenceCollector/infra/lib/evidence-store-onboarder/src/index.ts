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
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import * as lambda from 'aws-lambda';
import { onboardEvidenceProvider } from './evidenceStoreClient';

export async function onEvent(
    event: lambda.CloudFormationCustomResourceEvent,
    _context: lambda.Context
): Promise<lambda.CloudFormationCustomResourceResponse> {
    console.log('Processing event', event);
    const physicalResourceId = 'sec-hub-evidence-collector-evidence-provider-creator';

    try {
        switch (event.RequestType) {
            case 'Create':
            case 'Update':
                console.info(`Processing event type ${event.RequestType}`);
                // check and register new evidence provider
                /* eslint-disable-next-line */
                const apiKey = await onboardEvidenceProvider(
                    event.ResourceProperties.EvidenceStoreUri,
                    event.ResourceProperties.EvidenceProviderId,
                    event.ResourceProperties.EvidenceSchemaId
                );

                if (apiKey) {
                    // save the api key to secrets
                    const secretsManagerClient = new SecretsManager({});

                    await secretsManagerClient.updateSecret({
                        SecretId: event.ResourceProperties.SecretId,
                        SecretString: apiKey,
                    });
                }

                return success(event, physicalResourceId);

            default:
                // do nothing for other types of event
                break;
        }
    } catch (error) {
        console.error('An error occurred while processing the event', error);
        return failed(event, physicalResourceId, error);
    }

    console.info('Done processing, all good');
    return success(event, physicalResourceId);
}

function success(
    event: lambda.CloudFormationCustomResourceEvent,
    physicalResourceId: string
): lambda.CloudFormationCustomResourceSuccessResponse {
    return {
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: physicalResourceId,
        StackId: event.StackId,
        Status: 'SUCCESS',
    };
}

function failed(
    event: lambda.CloudFormationCustomResourceEvent,
    physicalResourceId: string,
    reason: any
): lambda.CloudFormationCustomResourceFailedResponse {
    return {
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: physicalResourceId,
        StackId: event.StackId,
        Status: 'FAILED',
        Reason: reason,
    };
}
