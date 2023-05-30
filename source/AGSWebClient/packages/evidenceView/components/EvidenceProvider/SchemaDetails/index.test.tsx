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
import * as appContext from '@ags/webclient-core/containers/AppContext';

import { BrowserRouter } from 'react-router-dom';
import EvidenceProviderSchemaDetails from '.';
import { SchemaDetails } from '@ags/webclient-evidence-core/types';
import { UserGroup } from '@ags/webclient-core/types';
import { render } from '@testing-library/react';

jest.mock('@ags/webclient-core/containers/AppContext');

const schemaDetails: SchemaDetails = {
    content: JSON.stringify({
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'object',
        properties: {
            evaluationContext: {
                type: 'object',
                properties: {
                    governedEntity: {
                        type: 'object',
                        properties: {
                            governedEntityId: { type: 'string' },
                            governedEntityType: { type: 'string' },
                        },
                        required: ['governedEntityId', 'governedEntityType'],
                    },
                    associatedAttestationIds: { type: 'array', items: {} },
                    environmentId: { type: 'string' },
                    estateId: { type: 'string' },
                    requiredPolicyIds: { type: 'array', items: {} },
                },
                required: [
                    'associatedAttestationIds',
                    'governedEntity',
                    'environmentId',
                    'estateId',
                    'requiredPolicyIds',
                ],
            },
            evaluatedCompliance: {
                type: 'object',
                properties: {
                    governedEntityId: { type: 'string' },
                    correlationId: { type: 'string' },
                    compliancePostures: {
                        type: 'array',
                        items: [
                            {
                                type: 'object',
                                properties: {
                                    complianceStatus: { type: 'string' },
                                    evaluatedControlTechniques: {
                                        type: 'array',
                                        items: [
                                            {
                                                type: 'object',
                                                properties: {
                                                    controlTechniqueEvaluationResult: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueId: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueName: {
                                                        type: 'string',
                                                    },
                                                },
                                                required: [
                                                    'controlTechniqueId',
                                                    'controlTechniqueName',
                                                    'controlTechniqueEvaluationResult',
                                                ],
                                            },
                                            {
                                                type: 'object',
                                                properties: {
                                                    controlTechniqueEvaluationResult: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueId: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueName: {
                                                        type: 'string',
                                                    },
                                                },
                                                required: [
                                                    'controlTechniqueId',
                                                    'controlTechniqueName',
                                                    'controlTechniqueEvaluationResult',
                                                ],
                                            },
                                            {
                                                type: 'object',
                                                properties: {
                                                    controlTechniqueEvaluationResult: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueId: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueName: {
                                                        type: 'string',
                                                    },
                                                },
                                                required: [
                                                    'controlTechniqueId',
                                                    'controlTechniqueName',
                                                    'controlTechniqueEvaluationResult',
                                                ],
                                            },
                                            {
                                                type: 'object',
                                                properties: {
                                                    controlTechniqueEvaluationResult: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueId: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueName: {
                                                        type: 'string',
                                                    },
                                                },
                                                required: [
                                                    'controlTechniqueId',
                                                    'controlTechniqueName',
                                                    'controlTechniqueEvaluationResult',
                                                ],
                                            },
                                            {
                                                type: 'object',
                                                properties: {
                                                    controlTechniqueEvaluationResult: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueId: {
                                                        type: 'string',
                                                    },
                                                    controlTechniqueName: {
                                                        type: 'string',
                                                    },
                                                },
                                                required: [
                                                    'controlTechniqueId',
                                                    'controlTechniqueName',
                                                    'controlTechniqueEvaluationResult',
                                                ],
                                            },
                                        ],
                                    },
                                    reasonPhrase: {
                                        type: 'array',
                                        items: [{ type: 'string' }],
                                    },
                                    evaluationTimestamp: { type: 'string' },
                                    latest: { type: 'boolean' },
                                },
                                required: [
                                    'complianceStatus',
                                    'reasonPhrase',
                                    'evaluationTimestamp',
                                    'latest',
                                    'evaluatedControlTechniques',
                                ],
                            },
                        ],
                    },
                },
                required: ['governedEntityId', 'correlationId', 'compliancePostures'],
            },
        },
        required: ['evaluationContext', 'evaluatedCompliance'],
    }),
    schemaId: 'AGS-CES-SCHEMA',
    createdTimestamp: '2021-08-10T16:05:22.995Z',
    providerId: 'ee2dd3c7-955c-4842-939d-6167e365997a',
};

describe('Evidence Schema Details', () => {
    test('render', async () => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));

        const { getByText } = render(
            <BrowserRouter>
                <EvidenceProviderSchemaDetails schemaDetails={schemaDetails} />
            </BrowserRouter>
        );
        //Check for Evidence Provider Schema details
        expect(getByText('Schema ID')).toBeInTheDocument();

        expect(getByText('AGS-CES-SCHEMA')).toBeInTheDocument();

        expect(getByText('Authority Id')).toBeInTheDocument();

        expect(getByText('ee2dd3c7-955c-4842-939d-6167e365997a')).toBeInTheDocument();

        expect(getByText('Evidence Provider Schema content')).toBeInTheDocument();
    });
});
