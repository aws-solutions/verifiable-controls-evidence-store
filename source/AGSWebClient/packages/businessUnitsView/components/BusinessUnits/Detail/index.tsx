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
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout';
import Stack from 'aws-northstar/layouts/Stack';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';

import { BusinessUnit } from '@ags/webclient-business-units-core/types';

export interface BusinessUnitDetailProps {
    businessUnit?: BusinessUnit;
    parentBusinessUnit?: BusinessUnit;
}

const BusinessUnitDetail: FunctionComponent<BusinessUnitDetailProps> = ({
    businessUnit,
    parentBusinessUnit,
}) => {
    return (
        <Container title="General Information">
            <ColumnLayout renderDivider={true}>
                <Column>
                    <Stack>
                        <KeyValuePair label="Name" value={businessUnit?.name} />
                        <KeyValuePair
                            label="Description"
                            value={businessUnit?.description}
                        />
                        <KeyValuePair
                            label="Business Owner"
                            value={businessUnit?.businessOwner}
                        />
                        {parentBusinessUnit && (
                            <KeyValuePair
                                label="Parent Business Unit"
                                value={parentBusinessUnit?.name}
                            />
                        )}
                    </Stack>
                </Column>
                <Column>
                    <Stack>
                        <KeyValuePair
                            label="Risk Owner"
                            value={businessUnit?.riskOwner}
                        />
                        <KeyValuePair
                            label="Tech Owner"
                            value={businessUnit?.techOwner}
                        />
                        <KeyValuePair
                            label="Created At"
                            value={
                                businessUnit?.createTime &&
                                formatDate(new Date(businessUnit.createTime))
                            }
                        />
                        <KeyValuePair
                            label="Last Updated At"
                            value={
                                businessUnit?.lastUpdateTime &&
                                formatDate(new Date(businessUnit.lastUpdateTime))
                            }
                        />
                    </Stack>
                </Column>
            </ColumnLayout>
        </Container>
    );
};

export default BusinessUnitDetail;
