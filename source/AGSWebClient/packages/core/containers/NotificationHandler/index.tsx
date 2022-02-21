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
import { FunctionComponent, useEffect } from 'react';
import { useAppLayoutContext, Notification } from 'aws-northstar/layouts/AppLayout';
import { useHistory } from 'react-router';

/**
 * NotificationHandler serves as a Page level enhancer to load all the notifications passed from last page
 * And dismiss them when user leave the page.
 */
const NotificationHandler: FunctionComponent = ({ children }) => {
    const { addNotification, dismissNotifications } = useAppLayoutContext();
    const history = useHistory();

    useEffect(() => {
        if (history.location.state) {
            const { notifications } = history.location.state as {
                notifications: Notification[];
            };
            if (notifications && notifications.length > 0) {
                notifications.forEach(addNotification);
            }
        }
    }, [history.location.pathname, history.location.state, addNotification]);

    useEffect(() => {
        return () => {
            dismissNotifications();
        };
    }, [history.location.pathname, dismissNotifications]);

    return <>{children}</>;
};

export default NotificationHandler;
