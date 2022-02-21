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
import { Notification } from 'aws-northstar/layouts/AppLayout';
import * as H from 'history';

/**
 * history.goBack does not support state. So this util method is to find
 * whether the <i>from<i> existing in the state.
 * If yes, use history.replace to go to the from path with the notification.
 * If no, use the fallback to addNotification (will not automatically disappear when page changes).
 */
const historyGoBackWithNotification = (
    history: H.History,
    addNotificationCallback: (notification: Notification) => void,
    notification: Notification
) => {
    if (history.location.state) {
        const { from } = history.location.state as { from?: string };
        if (from) {
            history.replace(from, {
                notifications: [notification],
            });
            return;
        }
    }

    addNotificationCallback(notification);
    history.goBack();
};

export default historyGoBackWithNotification;
