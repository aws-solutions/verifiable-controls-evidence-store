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

import './common/BaseContainer';
import './common/Xray';

import { Router } from '@apjsb-serverless-lib/lambda-router';
import { MainHandler } from './common/MainHandler';
import { setupContainer } from './Container';

import { CreateProviderHandler } from './handlers/CreateProviderHandler';
import { CreateEvidenceHandler } from './handlers/CreateEvidenceHandler';
import { GetProviderHandler } from './handlers/GetProviderHandler';
import { GetEvidenceHandler } from './handlers/GetEvidenceHandler';
import { GetEvidencesHandler } from './handlers/GetEvidencesHandler';

import { UpdateProviderHandler } from './handlers/UpdateProviderHandler';
import { CreateEvidenceSchemaHandler } from './handlers/CreateEvidenceSchemaHandler';
import { GetEvidenceSchemaHandler } from './handlers/GetEvidenceSchemaHandler';
import { GetEvidenceVerificationStatusHandler } from './handlers/GetEvidenceVerificationStatusHandler';
import { ListProviderHandler } from './handlers/ListProviderHandler';
import { GetEvidenceRevisionsHandler } from './handlers/GetEvidenceRevisionsHandler';
import { GetAttachmentLinkHandler } from './handlers/GetAttachmentLinkHandler';

setupContainer();

const routes = new Router()
    .addRoute(
        (e) => e.httpMethod === 'POST' && e.resource == '/evidences',
        CreateEvidenceHandler
    )
    .addRoute(
        (e) => e.httpMethod === 'POST' && e.resource == '/providers',
        CreateProviderHandler
    )
    .addRoute(
        (e) => e.httpMethod === 'GET' && e.resource == '/providers',
        ListProviderHandler
    )
    .addRoute(
        (e) => e.httpMethod === 'POST' && e.resource == '/evidences/search',
        GetEvidencesHandler
    )
    .addRoute(
        (e) => e.httpMethod === 'GET' && e.resource == '/evidences/{id}',
        GetEvidenceHandler
    )
    .addRoute(
        (e) => e.httpMethod === 'GET' && e.resource == '/providers/{id}',
        GetProviderHandler
    )
    .addRoute(
        (e) => e.httpMethod === 'PUT' && e.resource == '/providers/{id}',
        UpdateProviderHandler
    )
    .addRoute(
        (e) => e.httpMethod === 'POST' && e.resource == '/providers/{id}/schemas',
        CreateEvidenceSchemaHandler
    )
    .addRoute(
        (e) =>
            e.httpMethod === 'GET' && e.resource == '/providers/{id}/schemas/{schemaId}',
        GetEvidenceSchemaHandler
    )
    .addRoute(
        (e) =>
            e.httpMethod === 'GET' &&
            e.resource.toLowerCase() == '/evidences/{id}/verificationstatus',
        GetEvidenceVerificationStatusHandler
    )
    .addRoute(
        (e) => e.httpMethod === 'GET' && e.resource === '/evidences/{id}/revisions',
        GetEvidenceRevisionsHandler
    )
    .addRoute(
        (e) =>
            e.httpMethod === 'GET' &&
            e.resource === '/evidences/{id}/attachments/{attachmentId}',
        GetAttachmentLinkHandler
    )
    .addRoute(
        (e) =>
            e.httpMethod === 'GET' &&
            e.resource === '/evidences/{id}/revisions/{revisionId}',
        GetEvidenceHandler
    )
    .addRoute(
        (e) =>
            e.httpMethod === 'GET' &&
            e.resource ===
                '/evidences/{id}/revisions/{revisionId}/attachments/{attachmentId}',
        GetAttachmentLinkHandler
    )
    .addRoute(
        (e) =>
            e.httpMethod === 'GET' &&
            e.resource === '/evidences/{id}/revisions/{revisionId}/verificationstatus',
        GetEvidenceVerificationStatusHandler
    );

export const lambdaHandler = new MainHandler(routes).lambdaHandler;
