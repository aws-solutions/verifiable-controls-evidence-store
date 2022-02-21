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
import Container from 'aws-northstar/layouts/Container';
import Inline from 'aws-northstar/layouts/Inline';
import TargetEntityCard from '../TargetEntityCard';

export interface RiskTargetEntity {
    type: string;
    id: string;
    owner: string;
    likelihood: string;
    impacts: RiskTargetEntityImpact[];
    entity: {
        name: string;
    };
}

export interface RiskTargetEntityImpact {
    name: string;
    severity: string;
    likelihood: string;
}

const mockRiskTargetEntities: RiskTargetEntity[] = [
    {
        id: 'BU1',
        type: 'Businese Unit',
        entity: {
            name: 'Mobile Banking',
        },
        owner: '<email-address>',
        likelihood: 'High',
        impacts: [
            {
                name: 'Reputational',
                severity: 'High',
                likelihood: 'Low',
            },
            {
                name: 'Financial',
                severity: 'Low',
                likelihood: 'High',
            },
            {
                name: 'Organizational',
                severity: 'Low',
                likelihood: 'Very Low',
            },
        ],
    },
    {
        id: 'APP1',
        type: 'Application',
        entity: {
            name: 'Net Bank App',
        },
        owner: '<email-address>',
        likelihood: 'High',
        impacts: [
            {
                name: 'Reputational',
                severity: 'High',
                likelihood: 'Low',
            },
            {
                name: 'Financial',
                severity: 'Low',
                likelihood: 'High',
            },
        ],
    },
];

const RiskTargetEntities: FunctionComponent = () => {
    return (
        <Container
            title={`Associated to ${mockRiskTargetEntities.length} Target Entities`}
        >
            <Inline>
                {mockRiskTargetEntities.map((te) => (
                    <TargetEntityCard key={te.id} {...te} />
                ))}
            </Inline>
        </Container>
    );
};

export default RiskTargetEntities;
