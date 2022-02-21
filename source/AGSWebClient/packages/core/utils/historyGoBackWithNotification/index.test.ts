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

import historyGoBackWithNotification from './index';
import * as H from 'history';

describe('history go back with notification', () => {
    test('replace', () => {
        const history = {
            location: {
                state: {
                    from: 'prevPage',
                },
            },
            replace: jest.fn(),
            goBack: jest.fn(),
        };
        historyGoBackWithNotification(history as unknown as H.History, jest.fn, {
            id: 'message1',
            header: 'message1',
        });

        expect(history.replace).toBeCalledWith('prevPage', {
            notifications: [{ header: 'message1', id: 'message1' }],
        });
        expect(history.goBack).toBeCalledTimes(0);
    });

    test('go back', () => {
        const history = {
            location: {
                state: {},
            },
            replace: jest.fn(),
            goBack: jest.fn(),
        };
        historyGoBackWithNotification(history as unknown as H.History, jest.fn, {
            id: 'message1',
            header: 'message1',
        });
        expect(history.goBack).toBeCalledTimes(1);
    });

    test('go back no state', () => {
        const history = {
            location: {},
            replace: jest.fn(),
            goBack: jest.fn(),
        };
        historyGoBackWithNotification(history as unknown as H.History, jest.fn, {
            id: 'message1',
            header: 'message1',
        });
        expect(history.goBack).toBeCalledTimes(1);
    });
});
