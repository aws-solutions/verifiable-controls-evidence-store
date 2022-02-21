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
import * as apig from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
export interface EvidenceStoreApiDefinitionProps {
    evidenceStoreApiGateway: apig.RestApi;
}

export class EvidenceStoreApiDefinition extends Construct {
    constructor(scope: Construct, id: string, props: EvidenceStoreApiDefinitionProps) {
        super(scope, id);

        const root = props.evidenceStoreApiGateway.root;

        // POST /evidences
        root.addResource('evidences').addMethod('POST', undefined, {
            apiKeyRequired: true,
        });

        // POST /evidences/search
        root.getResource('evidences')?.addResource('search').addMethod('POST');

        // GET /evidences/{id}
        root.getResource('evidences')?.addResource('{id}').addMethod('GET');

        // GET /evidences/{id}/verificationstatus
        root.getResource('evidences')
            ?.getResource('{id}')
            ?.addResource('verificationstatus')
            .addMethod('GET');

        // GET /evidences/{id}/revisions
        root.getResource('evidences')
            ?.getResource('{id}')
            ?.addResource('revisions')
            .addMethod('GET');

        // GET /evidences/{id}/attachments/{attachmentId}
        root.getResource('evidences')
            ?.getResource('{id}')
            ?.addResource('attachments')
            .addResource('{attachmentId}')
            .addMethod('GET');

        // GET /evidences/{id}/revisions/{revisionId}
        root.getResource('evidences')
            ?.getResource('{id}')
            ?.getResource('revisions')
            ?.addResource('{revisionId}')
            .addMethod('GET');

        // GET /evidences/{id}/revisions/{revisionId}/attachments/{attachmentId}
        root.getResource('evidences')
            ?.getResource('{id}')
            ?.getResource('revisions')
            ?.getResource('{revisionId}')
            ?.addResource('attachments')
            .addResource('{attachmentId}')
            .addMethod('GET');

        // GET /evidences/{id}/revisions/{revisionId}/verificationstatus
        root.getResource('evidences')
            ?.getResource('{id}')
            ?.getResource('revisions')
            ?.getResource('{revisionId}')
            ?.addResource('verificationstatus')
            .addMethod('GET');

        // POST /providers
        root.addResource('providers').addMethod('POST');

        // GET /providers
        root.getResource('providers')?.addMethod('GET');

        // GET /providers/{id}
        root.getResource('providers')?.addResource('{id}').addMethod('GET');

        // PUT /providers/{id}
        root.getResource('providers')?.getResource('{id}')?.addMethod('PUT');

        // POST /providers/{id}/schemas
        root.getResource('providers')
            ?.getResource('{id}')
            ?.addResource('schemas')
            .addMethod('POST');

        // GET /providers/{id}/schemas
        root.getResource('providers')
            ?.getResource('{id}')
            ?.getResource('schemas')
            ?.addMethod('GET');

        // GET /providers/{id}/schemas/{schemaId}
        root.getResource('providers')
            ?.getResource('{id}')
            ?.getResource('schemas')
            ?.addResource('{schemaId}')
            .addMethod('GET');
    }
}
