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
import { FunctionComponent, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useGovSuiteAppApi } from '..//AppContext';
import { getHtmlPageHeader } from '../../utils/appUtils';

export interface HelmetSettingsProps {
    pageHtmlTitle?: string;
}

const HelmetSettings: FunctionComponent<HelmetSettingsProps> = ({ pageHtmlTitle }) => {
    const { apiEndpoints } = useGovSuiteAppApi();
    const htmlTitleText = useMemo(() => {
        return getHtmlPageHeader(apiEndpoints ?? {});
    }, [apiEndpoints]);
    return (
        <Helmet>
            <title>{pageHtmlTitle ?? htmlTitleText}</title>
        </Helmet>
    );
};

export default HelmetSettings;
