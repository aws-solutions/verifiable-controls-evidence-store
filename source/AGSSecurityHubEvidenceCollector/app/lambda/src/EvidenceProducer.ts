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

import { AgsContext, Evidence } from './common/Types';
import { recordEvidence } from './clients/EvidenceStoreClient';
import { storeFinding } from './clients/S3Client';
import { SecretsManagerClient } from './clients/SecretManagerClient';
import { SSMParameterClient } from './clients/SSMParameterClient';

export class EvidenceProducer {
    protected evidenceStoreApiKey: string = '';
    protected evidenceStoreApiEndpoint: string = '';
    public ssmParameterClient: SSMParameterClient;
    public secretManagerClient: SecretsManagerClient;

    public constructor() {
        this.ssmParameterClient = SSMParameterClient.getInstance();
        this.secretManagerClient = SecretsManagerClient.getInstance();
    }

    public async setup(
        evidenceStoreApiParamName: string,
        evidenceStoreApiSecretName: string
    ): Promise<void> {
        console.debug('Initialising evidence producer');
        if (evidenceStoreApiParamName === '' || evidenceStoreApiSecretName === '') {
            throw new Error(
                'Could not retrieve params needed to reach the EvidenceStore'
            );
        }

        try {
            if (this.evidenceStoreApiEndpoint === '') {
                this.evidenceStoreApiEndpoint =
                    await this.ssmParameterClient.getStringParameterValue(
                        evidenceStoreApiParamName
                    );
            }
            if (this.evidenceStoreApiKey === '') {
                this.evidenceStoreApiKey = await this.secretManagerClient.getSecretKey(
                    evidenceStoreApiSecretName
                );
            }
        } catch (e) {
            throw new Error(
                'Could not retrieve params needed to reach the EvidenceStore'
            );
        }
    }

    protected saveEvidence(evidences: (Evidence | undefined)[]): Promise<boolean[]> {
        return recordEvidence(
            evidences,
            this.evidenceStoreApiEndpoint,
            this.evidenceStoreApiKey
        );
    }

    protected async storeOriginalFindingsInS3(
        finding: any,
        findingId: string,
        findingSourceInfo: string
    ): Promise<string> {
        return storeFinding(finding, findingId, findingSourceInfo);
    }

    protected constructAgsContext(tags: {
        [key: string]: string | undefined;
    }): AgsContext | undefined {
        const environmentName = tags['AGSEnvName'];
        const environmentId = tags['AGSEnvId'];
        const applicationName = tags['AGSAppName'];
        const applicationId = tags['AGSAppId'];
        const releaseId = tags['AGSReleaseId'];
        const deploymentId = tags['AGSDeploymentId'];

        if (
            !environmentName &&
            !environmentId &&
            !applicationName &&
            !applicationId &&
            !releaseId &&
            !deploymentId
        ) {
            return undefined;
        }

        return {
            applicationName,
            applicationId,
            environmentName,
            environmentId,
            releaseId,
            deploymentId,
        };
    }
}
