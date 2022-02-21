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

import { FunctionComponent } from 'react';
import Box from 'aws-northstar/layouts/Box';
import Alert from 'aws-northstar/components/Alert';

const PermissionDenied: FunctionComponent = () => (
    <Box width="100%" display="flex" justifyContent="center" p={10}>
        <Alert type="error" header="You do not have permission to access this page">
            If you believe you have received this message in error, please contact
            Governance Suite administrator.
        </Alert>
    </Box>
);

export default PermissionDenied;
