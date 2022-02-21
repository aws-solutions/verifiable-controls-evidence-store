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

import { getAppHeader, getNavHeader, getHtmlPageHeader } from './index';

describe('header names', () => {
    test('app header', () => {
        expect(
            getAppHeader({
                AGSEvidenceStore: 'http://test',
            })
        ).toBe('Verifiable Evidence Store');
    });

    test('app header service not exist', () => {
        expect(getAppHeader({})).toBe('AWS Governance Suite');
    });

    test('nav header', () => {
        expect(
            getNavHeader({
                AGSEvidenceStore: 'http://test',
            })
        ).toBe('Verifiable Evidence Store');
    });

    test('nav header service not exist', () => {
        expect(getNavHeader({})).toBe('AWS Governance Suite');
    });

    test('html page header', () => {
        expect(
            getHtmlPageHeader({
                AGSEvidenceStore: 'http://test',
            })
        ).toBe('Verifiable Evidence Store');
    });

    test('html page header service not exist', () => {
        expect(getHtmlPageHeader({})).toBe('AWS Governance Suite');
    });

    test('all services exist', () => {
        expect(
            getHtmlPageHeader({
                AGSEvidenceStore: 'http://test',
                AGSReleaseManagementService: 'http://test',
                AGSRiskManagementService: 'http://test',
                AGSEstateManagementService: 'http://test',
                AGSComplianceEvaluatorService: 'http://test',
            })
        ).toBe('AWS Governance Suite');
    });
});
