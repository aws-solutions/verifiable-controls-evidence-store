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
import { FunctionComponent, useMemo, useState } from 'react';
import Tabs from 'aws-northstar/components/Tabs';
import Container from 'aws-northstar/layouts/Container';
import { useGovSuiteAppApi } from '@ags/webclient-core/containers/AppContext';
import { GovernedEntity } from '@ags/webclient-compliance-core/types';
import Feature from '../../config/features';
import RiskDashboard from '../RiskDashboard';
import ComplianceDashboard from '../ComplianceDashboard';
import RiskComplianceDashboardFilter from '../RiskComplianceDashboardFilter';

export type RiskComplianceDashboardContainerProps = GovernedEntity & {
    linkedEnvClasses?: string[];
};

const RiskComplianceDashboard: FunctionComponent<RiskComplianceDashboardContainerProps> =
    ({ linkedEnvClasses, ...props }) => {
        const [envClass, setEnvClass] = useState<string>();
        const { isFeatureOn } = useGovSuiteAppApi();
        const showRiskDashboard = useMemo(() => {
            return isFeatureOn(Feature.RiskDashboard);
        }, [isFeatureOn]);

        const filter = useMemo(() => {
            return (
                <RiskComplianceDashboardFilter
                    envClass={envClass}
                    setEnvClass={setEnvClass}
                    linkedEnvClasses={linkedEnvClasses}
                />
            );
        }, [envClass, setEnvClass, linkedEnvClasses]);

        const complianceDashboard = useMemo(() => {
            return <ComplianceDashboard {...props} envClass={envClass} filter={filter} />;
        }, [props, envClass, filter]);

        const riskDashboard = useMemo(() => {
            return showRiskDashboard ? (
                <RiskDashboard {...props} envClass={envClass} filter={filter} />
            ) : null;
        }, [props, envClass, filter, showRiskDashboard]);

        return showRiskDashboard ? (
            <Tabs
                variant="container"
                tabs={[
                    {
                        label: 'Risk Posture',
                        id: 'risk',
                        content: riskDashboard,
                    },
                    {
                        label: 'Compliance Posture',
                        id: 'compliance',
                        content: complianceDashboard,
                    },
                ]}
            />
        ) : (
            <Container title="Compliance Posture">{complianceDashboard}</Container>
        );
    };

export default RiskComplianceDashboard;
