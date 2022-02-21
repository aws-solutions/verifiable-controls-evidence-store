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

import { EvidenceProviderRepository } from './data/EvidenceProviderRepository';
import { EvidenceProviderService } from './services/EvidenceProviderService';
import { EvidenceContentRepository } from './data/EvidenceContentRepository';
import { EvidenceRepository } from './data/EvidenceRepository';
import { EvidenceService } from './services/EvidenceService';
import { CreateProviderHandler } from './handlers/CreateProviderHandler';
import { CreateEvidenceHandler } from './handlers/CreateEvidenceHandler';
import { GetProviderHandler } from './handlers/GetProviderHandler';
import { GetEvidenceHandler } from './handlers/GetEvidenceHandler';
import { GetEvidencesHandler } from './handlers/GetEvidencesHandler';

import { UpdateProviderHandler } from './handlers/UpdateProviderHandler';
import { container } from 'tsyringe';
import { EvidenceSchemaRepository } from './data/EvidenceSchemaRepository';
import { CreateEvidenceSchemaHandler } from './handlers/CreateEvidenceSchemaHandler';
import { GetEvidenceSchemaHandler } from './handlers/GetEvidenceSchemaHandler';
import { ApiKeyRepository } from './data/ApiKeyRepository';
import { CreateProviderInputValidator } from './validators/CreateProviderInputValidator';
import { CreateEvidenceInputValidator } from './validators/CreateEvidenceInputValidator';
import { CreateEvidenceSchemaInputValidator } from './validators/CreateEvidenceSchemaInputValidator';
import { UpdateProviderInputValidator } from './validators/UpdateProviderInputValidator';
import { GetEvidencesInputValidator } from './validators/GetEvidencesInputValidator';
import { QldbHelper } from './data/QldbHelper';
import { GetEvidenceVerificationStatusHandler } from './handlers/GetEvidenceVerificationStatusHandler';
import { ListProviderHandler } from './handlers/ListProviderHandler';
import { GetEvidenceRevisionsHandler } from './handlers/GetEvidenceRevisionsHandler';
import { GetAttachmentLinkHandler } from './handlers/GetAttachmentLinkHandler';

export function setupContainer(): void {
    // request handlers
    container.register<CreateEvidenceHandler>('CreateEvidenceHandler', {
        useClass: CreateEvidenceHandler,
    });
    container.register<CreateProviderHandler>('CreateProviderHandler', {
        useClass: CreateProviderHandler,
    });
    container.register<GetProviderHandler>('GetProviderHandler', {
        useClass: GetProviderHandler,
    });
    container.register<UpdateProviderHandler>('UpdateProviderHandler', {
        useClass: UpdateProviderHandler,
    });
    container.register<GetEvidenceHandler>('GetEvidenceHandler', {
        useClass: GetEvidenceHandler,
    });
    container.register<GetEvidencesHandler>('GetEvidencesHandler', {
        useClass: GetEvidencesHandler,
    });
    container.register<CreateEvidenceSchemaHandler>('CreateEvidenceSchemaHandler', {
        useClass: CreateEvidenceSchemaHandler,
    });
    container.register<GetEvidenceSchemaHandler>('GetEvidenceSchemaHandler', {
        useClass: GetEvidenceSchemaHandler,
    });
    container.register<GetEvidenceVerificationStatusHandler>(
        'GetEvidenceVerificationStatusHandler',
        { useClass: GetEvidenceVerificationStatusHandler }
    );
    container.register<ListProviderHandler>('ListProviderHandler', {
        useClass: ListProviderHandler,
    });
    container.register<GetEvidenceRevisionsHandler>('GetEvidenceRevisionsHandler', {
        useClass: GetEvidenceRevisionsHandler,
    });
    container.register<GetAttachmentLinkHandler>('GetAttachmentLinkHandler', {
        useClass: GetAttachmentLinkHandler,
    });

    // services
    container.register<EvidenceProviderService>('EvidenceProviderService', {
        useClass: EvidenceProviderService,
    });
    container.register<EvidenceService>('EvidenceService', {
        useClass: EvidenceService,
    });
    container.register<QldbHelper>('QldbHelper', { useClass: QldbHelper });

    // data repositories
    container.register<EvidenceProviderRepository>('EvidenceProviderRepository', {
        useClass: EvidenceProviderRepository,
    });
    container.register<EvidenceContentRepository>('EvidenceContentRepository', {
        useClass: EvidenceContentRepository,
    });
    container.register<EvidenceRepository>('EvidenceRepository', {
        useClass: EvidenceRepository,
    });
    container.register<EvidenceSchemaRepository>('EvidenceSchemaRepository', {
        useClass: EvidenceSchemaRepository,
    });
    container.register<ApiKeyRepository>('ApiKeyRepository', {
        useClass: ApiKeyRepository,
    });

    // validators
    container.register<CreateProviderInputValidator>('CreateProviderInputValidator', {
        useClass: CreateProviderInputValidator,
    });
    container.register<CreateEvidenceInputValidator>('CreateEvidenceInputValidator', {
        useClass: CreateEvidenceInputValidator,
    });
    container.register<CreateEvidenceSchemaInputValidator>(
        'CreateEvidenceSchemaInputValidator',
        { useClass: CreateEvidenceSchemaInputValidator }
    );
    container.register<UpdateProviderInputValidator>('UpdateProviderInputValidator', {
        useClass: UpdateProviderInputValidator,
    });
    container.register<GetEvidencesInputValidator>('GetEvidencesInputValidator', {
        useClass: GetEvidencesInputValidator,
    });
}
