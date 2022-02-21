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
import { FunctionComponent, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGovSuiteAppApi } from '../../containers/AppContext';

const FeatureController: FunctionComponent = ({ children }) => {
    const location = useLocation();
    const { featureToggles, setFeatureToggles } = useGovSuiteAppApi();

    const query = useMemo(() => {
        return new URLSearchParams(location.search);
    }, [location]);

    useEffect(() => {
        const features = query.get('features') || '';
        if (features) {
            setFeatureToggles(features);
        }
    }, [query, featureToggles, setFeatureToggles]);
    return <>{children}</>;
};

export default FeatureController;
