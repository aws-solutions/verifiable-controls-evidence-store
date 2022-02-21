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
import { ListApplications } from './queries/listApplications';
import { ListAppAttributes } from './queries/listAppAttributes';
import { GetApplication } from './queries/getApplication';
import { GetAppAttribute } from './queries/getAppAttribute';
import { QueryType } from './types';

const queryMap = {
    [QueryType.LIST_APPLICATIONS]: ListApplications,
    [QueryType.LIST_APPATTRIBUTES]: ListAppAttributes,
    [QueryType.GET_APPATTRIBUTE]: GetAppAttribute,
    [QueryType.GET_APPLICATION]: GetApplication,
};

export default queryMap;
