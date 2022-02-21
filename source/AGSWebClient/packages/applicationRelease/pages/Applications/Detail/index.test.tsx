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
import { render, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ApplicationDetail from '.';
import { QueryType } from '@ags/webclient-application-release-core/queries';
import { useAgsQuery, useAgsMutation } from '@ags/webclient-core/queries';
import { when } from 'jest-when';
import { UserGroup } from '@ags/webclient-core/types';
import { QueryType as EstateQueryType } from '@ags/webclient-estates-core/queries';
import * as appContext from '@ags/webclient-core/containers/AppContext';

// Mocks
const mockMutateFn = jest.fn();
const mockUseHistoryReplaceFn = jest.fn();
const mockUseHistoryPushFn = jest.fn();
const mockAddNotificationFn = jest.fn();

jest.mock('@ags/webclient-core/containers/AppContext');
jest.mock('@ags/webclient-core/queries');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({
        push: mockUseHistoryPushFn,
        replace: mockUseHistoryReplaceFn,
    }),
    useParams: () => ({
        applicationId: fixtureGetApplication.name,
    }),
}));
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({
        addNotification: mockAddNotificationFn,
    }),
}));
const mockedUseAgsQuery = useAgsQuery as jest.Mock<any>;
const mockedUseAgsMutation = useAgsMutation as jest.Mock<any>;

const fixtureGetApplication = {
    name: 'App1642352501882',
    description: 'Test application description',
    applicationOwner: 'me@me.com',
    estateId: 'est-pt6oeb2u11',
    environmentIds: ['env-pt6oeb2u11-s5r21vnnqz', 'env-pt6oeb2u11-ch62t2lil7'],
    attributes: { dataClassification: 'PII', hostingConstruct: 'lambda' },
    metadata: {
        codeSigningCertFingerprint:
            '4D:72:78:C9:92:E7:9A:73:E0:CE:D6:73:63:EB:7A:01:6E:88:66:73:9B:FD:0D:A7:77:82:98:8B:AA:78:CB:55',
    },
    pipelineProvisionStatus: 'ACTIVE',
    pipelineProvisionError: '',
    pipelineData: {
        ciArtifactBucketName: 'dev-ags-ci-art-teamdev-app1642352501882',
        pipelineStackName: 'dev-App1642352501882-PipelineStack',
        pipelineArn:
            'arn:aws:codepipeline:ap-southeast-2:126412716007:dev-App1642352501882-Pipeline',
        ciArtifactBucketRegion: 'ap-southeast-2',
        ciArtifactBucketUri: 's3://dev-ags-ci-art-teamdev-app1642352501882/app.zip',
        ciArtifactBucketKmsArn:
            'arn:aws:kms:ap-southeast-2:126412716007:key/a02514da-0c5b-4473-a7a5-fd27b91f440f',
        ciArtifactBucketKey: 'app.zip',
    },
};

const fixtureGetReleaseCandidates = {
    results: [
        {
            releaseCandidateId: 'ooN5gFXgXIgoCuCZph8aaFlXWGUo8_UnQladSp2h5Wk',
            externalPipelineId:
                'arn:aws:codepipeline:ap-southeast-2:126412716007:dev-App1642352501882-Pipeline',
            externalPipelineExecutionId: '8da5a3ee-5dde-444a-a942-d4fdb23ff5b3',
            applicationId: 'APP1642352501882',
            creationTime: '2022-01-16T17:14:27.028Z',
            commitId: '7770074edc3fab75044ad91ac319b5444c3f3bb1',
            sourceLocation:
                'https://git-codecommit.us-west-2.amazonaws.com/v1/repos/Ags-sample-serverless-app@mainline',
            releaseArtifactUri:
                's3://dev-ags-ci-art-teamdev-app1642352501882/app.zip?versionId=GHW0b.qzBI.KbzKZsDAbCoRifUSmlvFO',
            graphBuild: true,
            deployments: [
                {
                    deploymentId: '70bf31f4-9da2-d273-f9fa-0ccf115f36f6',
                    environmentId: 'env-pt6oeb2u11-ch62t2lil7',
                    state: 'Successful',
                },
                {
                    deploymentId: '24bf31f1-8173-4b6b-8de5-4d928a4d40bf',
                    environmentId: 'env-pt6oeb2u11-s5r21vnnqz',
                    state: 'Successful',
                },
            ],
            artifacts: [
                {
                    artifactName: 'apjsb-serverless-template',
                    artifactVersion: '0.0.1',
                    dependencies: [
                        {
                            name: '@apjsb-serverless-lib/apjsb-aws-httpclient',
                            version: '0.1.14',
                        },
                        {
                            name: '@apjsb-serverless-lib/aws-canary-test',
                            version: '1.0.7',
                        },
                        { name: '@apjsb-serverless-lib/common-types', version: '1.0.1' },
                        { name: '@apjsb-serverless-lib/logger', version: '1.0.1' },
                        {
                            name: '@apjsb-serverless-lib/middleware-chain',
                            version: '1.0.1',
                        },
                        {
                            name: '@apjsb-serverless-lib/request-logger',
                            version: '1.0.1',
                        },
                        {
                            name: '@apjsb-serverless-lib/response-formatter',
                            version: '1.0.1',
                        },
                        { name: '@aws-cdk/aws-synthetics', version: '1.93.0' },
                        { name: '@middy/core', version: '1.5.1' },
                        { name: '@middy/error-logger', version: '1.5.1' },
                        { name: '@middy/http-cors', version: '1.5.2' },
                        { name: '@middy/http-error-handler', version: '1.5.1' },
                        { name: '@middy/input-output-logger', version: '1.5.1' },
                        { name: '@types/winston', version: '2.4.4' },
                        { name: 'ajv', version: '7.2.1' },
                        { name: 'aws-sdk', version: '2.799.0' },
                        { name: 'aws-xray-sdk', version: '3.2.0' },
                        { name: 'reflect-metadata', version: '0.1.13' },
                        { name: 'tsyringe', version: '4.4.0' },
                        { name: 'uuid', version: '8.3.2' },
                        { name: 'winston', version: '3.3.3' },
                    ],
                },
                {
                    artifactName: 'apjsb-serverless-template-infra',
                    artifactVersion: '0.1.0',
                    dependencies: [
                        { name: '@aws-cdk/aws-apigateway', version: '1.93.0' },
                        { name: '@aws-cdk/aws-codedeploy', version: '1.93.0' },
                        { name: '@aws-cdk/aws-dynamodb', version: '1.93.0' },
                        { name: '@aws-cdk/aws-iam', version: '1.93.0' },
                        { name: '@aws-cdk/aws-kms', version: '1.93.0' },
                        { name: '@aws-cdk/aws-lambda', version: '1.93.0' },
                        { name: '@aws-cdk/aws-synthetics', version: '1.93.0' },
                        { name: '@aws-cdk/core', version: '1.93.0' },
                        { name: 'cdk-assume-role-credential-plugin', version: '1.2.2' },
                        { name: 'loglevel', version: '1.7.1' },
                        { name: 'source-map-support', version: '0.5.16' },
                    ],
                },
            ],
        },
    ],
};

const fixtureGetEstate = {
    status: 'Active',
    environments: [
        {
            awsAccountId: '878802839433',
            creationTime: '2021-10-25T22:45:15.578Z',
            estateId: 'est-pt6oeb2u11',
            name: 'DEV',
            isManualApprovalRequired: false,
            lastUpdatedTime: '2021-10-25T22:45:15.578Z',
            id: 'env-pt6oeb2u11-s5r21vnnqz',
            envClasses: ['dev'],
            mandatory: true,
        },
        {
            awsAccountId: '032806337907',
            creationTime: '2021-10-25T22:45:15.578Z',
            estateId: 'est-pt6oeb2u11',
            name: 'PROD',
            isManualApprovalRequired: false,
            lastUpdatedTime: '2021-10-25T22:45:15.578Z',
            id: 'env-pt6oeb2u11-ch62t2lil7',
            envClasses: ['prod'],
            mandatory: true,
        },
    ],
    id: 'est-pt6oeb2u11',
    name: 'ags-dev-sample-estate',
    parentBUId: 'd3d70a02-56d9-4c12-afcc-367d4c9d54ab',
    toolingAccountId: '126412716007',
};

describe('Application Details Page', () => {
    let useMutationOptions: any;

    beforeEach(() => {
        mockAddNotificationFn.mockRestore();
        mockMutateFn.mockRestore();
        mockUseHistoryReplaceFn.mockRestore();
    });

    beforeAll(() => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));
        const mockUseAgsQueryfn = jest.fn();
        when(mockUseAgsQueryfn)
            .calledWith(QueryType.GET_APPLICATION, expect.any(String))
            .mockReturnValue({
                isLoading: false,
                data: fixtureGetApplication,
                isError: false,
                error: null,
            });

        when(mockUseAgsQueryfn)
            .calledWith(QueryType.GET_RELEASE_CANDIDATES, expect.any(String))
            .mockReturnValue({
                isLoading: false,
                data: fixtureGetReleaseCandidates,
            });

        when(mockUseAgsQueryfn)
            .calledWith(EstateQueryType.GET_ESTATE, expect.any(String))
            .mockReturnValue({
                data: fixtureGetEstate,
            });

        mockedUseAgsQuery.mockImplementation(mockUseAgsQueryfn);

        mockedUseAgsMutation.mockImplementation(
            (_mutationType: string, options?: any) => {
                useMutationOptions = options;

                return {
                    isLoading: false,
                    mutate: mockMutateFn,
                };
            }
        );
    });

    test('render page', async () => {
        const { getByText, getAllByText } = render(
            <BrowserRouter>
                <ApplicationDetail />
            </BrowserRouter>
        );

        // General Information
        expect(getByText('General Information')).toBeInTheDocument();
        expect(getByText('Name')).toBeInTheDocument();
        expect(getAllByText(fixtureGetApplication.name).length).toBeGreaterThan(0);
        expect(getByText('Description')).toBeInTheDocument();
        expect(getByText(fixtureGetApplication.description)).toBeInTheDocument();
        expect(getByText('Application Owner')).toBeInTheDocument();
        expect(getByText(fixtureGetApplication.applicationOwner)).toBeInTheDocument();
        expect(getByText('Pipeline Provision Status')).toBeInTheDocument();
        expect(
            getAllByText(fixtureGetApplication.pipelineProvisionStatus).length
        ).toBeGreaterThan(0);
        expect(getByText('Estate')).toBeInTheDocument();
        expect(getByText(fixtureGetEstate.name)).toBeInTheDocument();
        expect(getByText('Environments')).toBeInTheDocument();
        expect(getByText('DEV, PROD')).toBeInTheDocument();

        // Attributes
        expect(
            getByText(
                `Attributes (${Object.keys(fixtureGetApplication.attributes).length})`
            )
        ).toBeInTheDocument();
        Object.entries(fixtureGetApplication.attributes).forEach(([key, value]) => {
            expect(getByText(key)).toBeInTheDocument();
            expect(getByText(value)).toBeInTheDocument();
        });

        // Metadata
        expect(
            getByText(`Metadata (${Object.keys(fixtureGetApplication.metadata).length})`)
        ).toBeInTheDocument();
        Object.entries(fixtureGetApplication.metadata).forEach(([key, value]) => {
            expect(getByText(key)).toBeInTheDocument();
            expect(getByText(value)).toBeInTheDocument();
        });

        // Pipeline data
        expect(
            getByText(
                `Pipeline Data (${
                    Object.keys(fixtureGetApplication.pipelineData).length
                })`
            )
        ).toBeInTheDocument();
        Object.entries(fixtureGetApplication.pipelineData).forEach(([key, value]) => {
            expect(getByText(key)).toBeInTheDocument();
            expect(getByText(value)).toBeInTheDocument();
        });

        // Release Candidates
        expect(
            getByText(
                `Release Candidates (${fixtureGetReleaseCandidates.results.length})`
            )
        ).toBeInTheDocument();
        fixtureGetReleaseCandidates.results.forEach((item) => {
            expect(getByText(item.releaseCandidateId)).toBeInTheDocument();
            expect(getByText(item.commitId)).toBeInTheDocument();
        });
    });

    test('render page - edit application', async () => {
        const { getByText } = render(
            <BrowserRouter>
                <ApplicationDetail />
            </BrowserRouter>
        );

        expect(getByText('Edit')).toBeInTheDocument();
        act(() => {
            fireEvent.click(getByText('Edit'));
        });
        expect(mockUseHistoryPushFn).toHaveBeenCalledWith(
            `/applications/${fixtureGetApplication.name}/update`
        );
    });

    test('render page - delete application - negative scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onError!(new Error('test error'), {});
        });

        const { getAllByText, getByRole } = render(
            <BrowserRouter>
                <ApplicationDetail />
            </BrowserRouter>
        );

        act(() => {
            fireEvent.click(getAllByText('Delete')[0]);
        });

        // Confirm delete
        act(() => {
            fireEvent.change(getByRole('textbox'), {
                target: { value: 'delete' },
            });
        });
        act(() => {
            fireEvent.click(getAllByText('Delete')[1]);
        });

        expect(mockMutateFn).toHaveBeenCalledWith({
            name: fixtureGetApplication.name,
            forceDelete: true,
        });
        // Assert error notification was called
        expect(mockAddNotificationFn).toHaveBeenCalledWith({
            id: expect.any(String),
            type: 'error',
            header: `Delete Application ${fixtureGetApplication.name} Failed.`,
            content: 'test error',
            dismissible: true,
        });
        expect(mockUseHistoryReplaceFn).not.toHaveBeenCalled();
    });

    test('render page - delete application - positive scenario', async () => {
        mockMutateFn.mockImplementation((_request: any) => {
            useMutationOptions?.onSuccess!({});
        });

        const { getAllByText, getByRole } = render(
            <BrowserRouter>
                <ApplicationDetail />
            </BrowserRouter>
        );

        act(() => {
            fireEvent.click(getAllByText('Delete')[0]);
        });

        // Confirm delete
        act(() => {
            fireEvent.change(getByRole('textbox'), {
                target: { value: 'delete' },
            });
        });
        act(() => {
            fireEvent.click(getAllByText('Delete')[1]);
        });

        expect(mockMutateFn).toHaveBeenCalledWith({
            name: fixtureGetApplication.name,
            forceDelete: true,
        });

        expect(mockUseHistoryReplaceFn).toHaveBeenCalledWith(`/applications`, {
            notifications: [
                {
                    id: expect.any(String),
                    type: 'success',
                    header: `Delete Application ${fixtureGetApplication.name} Succeeded.`,
                    dismissible: true,
                },
            ],
        });
        // Assert error notification has not been called
        expect(mockAddNotificationFn).not.toHaveBeenCalled();
    });
});
