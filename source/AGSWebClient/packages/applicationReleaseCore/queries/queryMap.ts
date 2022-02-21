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

import { QueryType } from './types';
import { GetApplication } from './queries/getApplication';
import { GetAttribute } from './queries/getAttribute';
import { GetReleaseCandidate } from './queries/getReleaseCandidate';
import { GetReleaseCandidates } from './queries/getReleaseCandidates';
import { ListApplications, ListAllApplications } from './queries/listApplications';
import { ListAttributes, ListAllAttributes } from './queries/listAttributes';
import { ListAllEstates } from './queries/listEstates';

const queryMap = {
    [QueryType.GET_APPLICATION]: GetApplication,
    [QueryType.GET_ATTRIBUTE]: GetAttribute,
    [QueryType.GET_RELEASE_CANDIDATE]: GetReleaseCandidate,
    [QueryType.GET_RELEASE_CANDIDATES]: GetReleaseCandidates,
    [QueryType.LIST_APPLICATIONS]: ListApplications,
    [QueryType.LIST_ALL_APPLICATIONS]: ListAllApplications,
    [QueryType.LIST_ATTRIBUTES]: ListAttributes,
    [QueryType.LIST_ALL_ATTRIBUTES]: ListAllAttributes,
    [QueryType.LIST_ALL_ESTATES]: ListAllEstates,
};

export default queryMap;
