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
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
    AgsPaginatedQueryResult,
    useAgsInfiniteQuery,
    useAgsListQuery,
} from '@ags/webclient-core/queries';
import * as appContext from '@ags/webclient-core/containers/AppContext';
import { UserGroup } from '@ags/webclient-core/types';
import EvidenceContainer from '.';
import { Evidence } from '@ags/webclient-evidence-core/types';
import { InfiniteData } from 'react-query';
import { QueryType } from '@ags/webclient-evidence-core/queries/types';

const mockAddNotification = jest.fn();

jest.mock('@ags/webclient-core/containers/AppContext');
jest.mock('@ags/webclient-core/queries');
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    ...jest.requireActual('aws-northstar/layouts/AppLayout'),
    useAppLayoutContext: () => ({ addNotification: mockAddNotification }),
}));

const mockedUseAgsInfiniteQuery = useAgsInfiniteQuery as jest.Mock<any, any>;
const mockedUseAgsListQuery = useAgsListQuery as jest.Mock<any>;

const evidenceData: InfiniteData<AgsPaginatedQueryResult<Evidence>> = {
    pages: [
        {
            results: [
                {
                    evidenceId: 'evidence1',
                    providerId: 'provider',
                    providerName: 'name',
                    createdTimestamp: '2022-01-05T05:27:29.191Z',
                    schemaId: 'schemaId',
                    targetId: 'my-target',
                },
            ],
            total: 1,
            nextToken: undefined,
        },
    ],
    pageParams: [],
};

describe('list evidences test', () => {
    beforeAll(() => {
        (appContext.useGovSuiteAppApi as jest.Mock<any, any>).mockImplementation(() => ({
            userGroups: [UserGroup.SystemAdmin],
        }));
    });
    beforeEach(() => {
        mockAddNotification.mockRestore();
    });

    test('can render empty list of evidences', () => {
        // arrange
        mockedUseAgsListQuery.mockImplementation((_queryType: string) => ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
        }));

        mockedUseAgsInfiniteQuery.mockImplementation((_: string, _filter: any) => ({
            data: undefined,
            hasNextPage: false,
            isLoading: false,
            error: null,
            isFetching: false,
            isFetchingNextPage: false,
            fetchNextPage: jest.fn(),
        }));

        // act
        render(
            <BrowserRouter>
                <EvidenceContainer />
            </BrowserRouter>
        );

        // assert
        expect(screen.getByText('Evidence (0)')).toBeInTheDocument();
    });

    test('can render list of evidences', () => {
        // arrange
        mockedUseAgsListQuery.mockImplementation((_queryType: string) => ({
            data: [{ providerId: 'provider', name: 'name' }],
            isLoading: false,
        }));

        mockedUseAgsInfiniteQuery.mockImplementation((_: string, _filter: any) => ({
            data: evidenceData,
            hasNextPage: false,
            isLoading: false,
            error: null,
            isFetching: false,
            isFetchingNextPage: false,
            fetchNextPage: jest.fn(),
        }));

        // act
        render(
            <BrowserRouter>
                <EvidenceContainer />
            </BrowserRouter>
        );

        // assert
        expect(screen.getByText('Evidence (1)')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Create an evidence' })
        ).toBeInTheDocument();
    });

    test('can search for evidences', () => {
        // arrange
        mockedUseAgsListQuery.mockImplementation((_queryType: string) => ({
            data: [{ providerId: 'provider', name: 'name' }],
            isLoading: false,
        }));

        mockedUseAgsInfiniteQuery.mockImplementation((_: string, _filter: any) => ({
            data: evidenceData,
            hasNextPage: false,
            isLoading: false,
            error: null,
            isFetching: false,
            isFetchingNextPage: false,
            fetchNextPage: jest.fn(),
        }));

        // act
        render(
            <BrowserRouter>
                <EvidenceContainer />
            </BrowserRouter>
        );
        act(() => {
            fireEvent.change(screen.getByLabelText('Evidence content'), {
                target: { value: 'content' },
            });
            fireEvent.change(screen.getByLabelText('Evidence schema id'), {
                target: { value: 'schemaId' },
            });
            fireEvent.click(screen.getByText('Search'));
        });

        // assert
        expect(mockedUseAgsInfiniteQuery).toHaveBeenCalledWith(
            QueryType.SEARCH_EVIDENCE,
            {
                schemaId: 'schemaId',
                content: 'content',
                targetIds: undefined,
            }
        );
    });
});
