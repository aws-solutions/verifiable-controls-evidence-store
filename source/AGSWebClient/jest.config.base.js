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

const path = require('path');

module.exports = {
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    transformIgnorePatterns: ['node_modules/(?!d3)/'],
    moduleNameMapper: {
        'react-use-localstorage': path.join(
            __dirname,
            '__mocks__',
            'react-use-localstorage'
        ),
        'aws-sdk': path.join(__dirname, '__mocks__', 'aws-sdk'),
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    setupFilesAfterEnv: [path.join(__dirname, 'jest', 'jest.setup.ts')],
    collectCoverageFrom: ['**/*.{ts,tsx}'],
    coveragePathIgnorePatterns: [
        '.*/app/',
        '.*/apps/',
        '.*/riskComplianceDashboardView/',
        '.*/RisksV2/',
        '.*/node_modules/',
        '.*/build/',
        '.*/dist/',
        '.*/crypress/',
        '.*/lighthouse/',
        '.*/pipeline/',
        '.*/scripts/',
        '.*/config/',
        '.*/scannerwork/',
        '.*\\.d\\.ts$',
        '.*\\.js$',
        '.*/routes\\.ts$',
        '.*/routes/index\\.tsx$',
        '.*/constants\\.ts$',
        '.*/aws\\.ts$',
        '.*/appConfig\\.ts$',
        'core/components/Heatmap/index.tsx',
        'core/components/LazyLoader/index.tsx',
        'core/queries/agsApi.ts',
        'core/queries/types.ts',
        'core/containers/App/index.tsx',
        'core/containers/AppContext/index.tsx',
        'core/enhancers/withEnhancers/index.tsx',
        'core/layouts/AppLayout/index.tsx',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    // to workaround ts-jest memory leak issue logged in https://github.com/kulshekhar/ts-jest/issues/1967
    // apply this fix: https://github.com/trivikr/aws-sdk-js-v3/commit/615a271dadfbe6d7deca1678abebbf4a6c29125c
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
};
