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
import { render } from '@testing-library/react';
import NotificationHandler from './index';

const mockAddNotification = jest.fn();
jest.mock('aws-northstar/layouts/AppLayout', () => ({
    useAppLayoutContext: () => ({
        addNotification: mockAddNotification,
        dismissNotifications: jest.fn(),
    }),
}));

jest.mock('react-router', () => ({
    useHistory: jest.fn(() => ({
        location: {
            state: {
                notifications: [
                    {
                        id: '1',
                        header: 'test1',
                    },
                    {
                        id: '2',
                        header: 'test2',
                    },
                ],
            },
            pathname: '/',
        },
    })),
}));

describe('NotificationHandler', () => {
    test('render', () => {
        const { getByText } = render(<NotificationHandler>TestText</NotificationHandler>);
        expect(getByText('TestText')).toBeInTheDocument();
        expect(mockAddNotification).toBeCalledTimes(2);
        expect(mockAddNotification).toHaveBeenNthCalledWith(
            1,
            {
                header: 'test1',
                id: '1',
            },
            0,
            [
                { header: 'test1', id: '1' },
                { header: 'test2', id: '2' },
            ]
        );
        expect(mockAddNotification).toHaveBeenNthCalledWith(
            2,
            { header: 'test2', id: '2' },
            1,
            [
                { header: 'test1', id: '1' },
                { header: 'test2', id: '2' },
            ]
        );
    });
});
