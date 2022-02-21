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
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SideNavigationItemType } from 'aws-northstar/components/SideNavigation';
import SideNavigation from './index';
import { UserGroup, RestrictedSideNavigationItem } from '../../types';

jest.mock('@ags/webclient-core/containers/AppContext', () => ({
    useGovSuiteAppApi: () => ({
        apiEndpoints: {
            ServiceA: 'endpointA',
            ServiceB: 'endpointB',
        },
    }),
}));

const template: RestrictedSideNavigationItem[] = [
    {
        text: 'Top Section',
        type: SideNavigationItemType.SECTION,
        restrictedGroups: [UserGroup.ApplicationOwner],
        requiredServices: ['ServiceA', 'ServiceB'],
        hideIfNoItem: false,
        expanded: true,
        items: [
            {
                text: 'Link1',
                type: SideNavigationItemType.LINK,
                restrictedGroups: [UserGroup.ApplicationOwner],
                requiredServices: ['ServiceA'],
                hideIfNoItem: true,
                items: [],
            },
            {
                text: 'Link2',
                type: SideNavigationItemType.LINK,
                restrictedGroups: [UserGroup.DomainOwner],
                requiredServices: ['ServiceB'],
                hideIfNoItem: true,
                items: [],
            },
            // this link should not show as its required service not exist
            {
                text: 'Link3',
                type: SideNavigationItemType.LINK,
                restrictedGroups: [UserGroup.DomainOwner],
                requiredServices: ['ServiceC'],
                hideIfNoItem: true,
                items: [],
            },
            // this link should not show as its required group not exist
            {
                text: 'Link4',
                type: SideNavigationItemType.LINK,
                restrictedGroups: [UserGroup.ChiefRiskOffice],
                requiredServices: ['ServiceB'],
                hideIfNoItem: true,
                items: [],
            },
            // this section should not show as its content is not showing
            {
                text: 'SectionNoShow',
                type: SideNavigationItemType.SECTION,
                restrictedGroups: [UserGroup.DomainOwner],
                requiredServices: ['ServiceB'],
                hideIfNoItem: true,
                expanded: true,
                items: [
                    {
                        text: 'Link5',
                        type: SideNavigationItemType.LINK,
                        restrictedGroups: [UserGroup.ChiefRiskOffice],
                        requiredServices: ['ServiceX'],
                        hideIfNoItem: true,
                        items: [],
                    },
                ],
            },
        ],
    },
];

const navData = {
    apiEndpoints: {
        ServiceA: 'endpointA',
        ServiceB: 'endpointB',
    },
    userGroups: [UserGroup.ApplicationOwner, UserGroup.DomainOwner],
    navigationTemplate: template,
};

describe('SideNavigation', () => {
    test('render', () => {
        const { getByText, queryByText } = render(
            <BrowserRouter>
                <SideNavigation heading="Header Text" data={navData} />
            </BrowserRouter>
        );
        expect(getByText('Header Text')).toBeInTheDocument();
        expect(getByText('Link1')).toBeInTheDocument();
        expect(getByText('Link2')).toBeInTheDocument();
        expect(queryByText('Link3')).not.toBeInTheDocument();
        expect(queryByText('Link4')).not.toBeInTheDocument();
        expect(queryByText('SectionNoShow')).not.toBeInTheDocument();
        expect(queryByText('Link5')).not.toBeInTheDocument();
    });
});
