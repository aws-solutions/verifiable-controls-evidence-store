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
export enum QueryType {
    LIST_APPLICATIONS = 'ListApplications',
    LIST_ALL_APPLICATIONS = 'ListAllApplications',
    LIST_ATTRIBUTES = 'ListAttributes',
    LIST_ALL_ATTRIBUTES = 'ListAllAttributes',
    GET_RELEASE_CANDIDATE = 'GetReleaseCandidate',
    GET_RELEASE_CANDIDATES = 'GetReleaseCandidates',
    GET_APPLICATION = 'GetApplication',
    GET_ATTRIBUTE = 'GetAttribute',
    LIST_ALL_ESTATES = 'ListAllEstates',
}

export enum MutationType {
    CREATE_APPLICATION = 'CreateApplication',
    UPDATE_APPLICATION = 'UpdateApplication',
    DELETE_APPLICATION = 'DeleteApplication',
    CREATE_ATTRIBUTE = 'CreateAttribute',
    UPDATE_ATTRIBUTE = 'UpdateAttribute',
    DELETE_ATTRIBUTE = 'DeleteAttribute',
}
