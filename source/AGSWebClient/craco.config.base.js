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
const { readdirSync } = require('fs');
const { getLoader, loaderByName } = require('@craco/craco');

const packages = readdirSync(path.join(__dirname, 'packages'), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(__dirname, 'packages', dirent.name));

module.exports = {
    webpack: {
        configure: (webpackConfig, arg) => {
            const { isFound, match } = getLoader(
                webpackConfig,
                loaderByName('babel-loader')
            );
            if (isFound) {
                const include = Array.isArray(match.loader.include)
                    ? match.loader.include
                    : [match.loader.include];

                match.loader.include = include.concat(packages);
            }
            return webpackConfig;
        },
    },
};
