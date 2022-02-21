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

import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { CreateProviderHandler } from 'src/handlers/CreateProviderHandler';
import { CreateEvidenceHandler } from 'src/handlers/CreateEvidenceHandler';
import { GetProviderHandler } from 'src/handlers/GetProviderHandler';
import { GetEvidenceHandler } from 'src/handlers/GetEvidenceHandler';
import { UpdateProviderHandler } from 'src/handlers/UpdateProviderHandler';
import { lambdaHandler } from 'src/App';
import { CreateEvidenceSchemaHandler } from 'src/handlers/CreateEvidenceSchemaHandler';
import { GetEvidenceSchemaHandler } from 'src/handlers/GetEvidenceSchemaHandler';
import { GetEvidenceVerificationStatusHandler } from 'src/handlers/GetEvidenceVerificationStatusHandler';
import { ListProviderHandler } from 'src/handlers/ListProviderHandler';
import { GetEvidenceRevisionsHandler } from 'src/handlers/GetEvidenceRevisionsHandler';
import { GetAttachmentLinkHandler } from 'src/handlers/GetAttachmentLinkHandler';

// This includes all tests for getByIdHandler()
describe('Evidence Store service lambda tests', () => {
    test('request POST /providers is routed to CreateProviderHandler', async () => {
        // arrange
        CreateProviderHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'POST',
                resource: '/providers',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(CreateProviderHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request POST /evidences is routed to CreateEvidenceHandler', async () => {
        // arrange
        CreateEvidenceHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'POST',
                resource: '/evidences',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(CreateEvidenceHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request GET /providers/{id} is routed to GetProviderHandler', async () => {
        // arrange
        GetProviderHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'GET',
                resource: '/providers/{id}',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(GetProviderHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request PUT /providers/{id} is routed to UpdateProviderHandler', async () => {
        // arrange
        UpdateProviderHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'PUT',
                resource: '/providers/{id}',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(UpdateProviderHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request GET /evidences/{id} is routed to GetEvidenceHandler', async () => {
        // arrange
        GetEvidenceHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'GET',
                resource: '/evidences/{id}',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(GetEvidenceHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request POST /providers/{id}/schemas is routed to CreateEvidenceSchemaHandler', async () => {
        // arrange
        CreateEvidenceSchemaHandler.prototype.handle = jest
            .fn()
            .mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'POST',
                resource: '/providers/{id}/schemas',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(CreateEvidenceSchemaHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request GET /providers/{id}/schemas/{id} is routed to GetEvidenceSchemaHandler', async () => {
        // arrange
        GetEvidenceSchemaHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'GET',
                resource: '/providers/{id}/schemas/{schemaId}',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(GetEvidenceSchemaHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request GET /evidences/{id}/verificationstatus is routed to GetEvidenceVerificationStatusHandler', async () => {
        // arrange
        GetEvidenceVerificationStatusHandler.prototype.handle = jest
            .fn()
            .mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'GET',
                resource: '/evidences/{id}/verificationstatus',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(GetEvidenceVerificationStatusHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request GET /providers is routed to ListProviderHandler', async () => {
        // arrange
        ListProviderHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'GET',
                resource: '/providers',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(ListProviderHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request GET /evidences/{id}/revisions is routed to GetEvidenceRevisionsHandler', async () => {
        // arrange
        GetEvidenceRevisionsHandler.prototype.handle = jest
            .fn()
            .mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'GET',
                resource: '/evidences/{id}/revisions',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(GetEvidenceRevisionsHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request GET /evidences/{id}/attachments/{attachmentId} is routed to GetAttachmentLinkHandler', async () => {
        // arrange
        GetAttachmentLinkHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'GET',
                resource: '/evidences/{id}/attachments/{attachmentId}',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(GetAttachmentLinkHandler.prototype.handle).toHaveBeenCalled();
    });

    test('request GET /evidences/{id}/revisions/{revisionId} is routed to GetEvidenceRevisionHandler', async () => {
        // arrange
        GetEvidenceHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await lambdaHandler(
            {
                httpMethod: 'GET',
                resource: '/evidences/{id}/revisions/{revisionId}',
            } as APIGatewayProxyEvent,
            {} as Context,
            () => ({})
        );

        // assert
        expect(GetEvidenceHandler.prototype.handle).toHaveBeenCalled();
    });
});
