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
import { formatDate } from '@ags/webclient-core/utils/helpers';
import Container from 'aws-northstar/layouts/Container';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import Stack from 'aws-northstar/layouts/Stack';
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout';
import Button from 'aws-northstar/components/Button';

import { EstateDisplay } from '@ags/webclient-estates-core/types';

export interface EstateProps {
    estate?: EstateDisplay;
}

const EstateDetail: FunctionComponent<EstateProps> = ({ estate }) => {
    //const history = useHistory();

    /** Action group for the table */
    const renderActionGroup = () => (
        <Button
            variant={'primary'}
            onClick={(e) => {
                // const path = generatePath(ROUTE_ESTATE_UPDATE, {
                //     estateId: estate?.id ?? '',
                // });
                // history.push(path);
            }}
            disabled={true}
        >
            Update Estate
        </Button>
    );

    if (!estate) {
        return null;
    }
    return (
        <Container
            title={`Estate Details - ${estate.name}`}
            subtitle={`Details about the ${estate.name} estate.`}
            actionGroup={renderActionGroup()}
        >
            <ColumnLayout>
                <Column key="column1">
                    <Stack>
                        <KeyValuePair label="Name" value={estate.name}></KeyValuePair>
                        <KeyValuePair
                            label="Tooling Account"
                            value={estate.toolingAccountId}
                        ></KeyValuePair>
                        <KeyValuePair
                            label="Business Unit"
                            value={estate.parentBUName}
                        ></KeyValuePair>
                    </Stack>
                </Column>
                <Column key="column2">
                    <Stack>
                        <KeyValuePair
                            label="Created At"
                            value={
                                estate.creationTime &&
                                formatDate(new Date(estate.creationTime))
                            }
                        ></KeyValuePair>
                        <KeyValuePair
                            label="Last Updated At"
                            value={
                                estate.lastUpdatedTime &&
                                formatDate(new Date(estate.lastUpdatedTime))
                            }
                        ></KeyValuePair>
                    </Stack>
                </Column>
                <Column key="column3">
                    <Stack>
                        <KeyValuePair
                            label="Environments"
                            value={`${estate.environments?.length || '-'}`}
                        ></KeyValuePair>
                    </Stack>
                </Column>
            </ColumnLayout>
        </Container>
    );
};

export default EstateDetail;
