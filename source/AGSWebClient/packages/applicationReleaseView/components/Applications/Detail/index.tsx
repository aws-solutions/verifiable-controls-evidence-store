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
import { Application } from '@ags/webclient-application-release-core/types';
import KeyValueTable from '../Table/KeyValue';
import PipelineStatus from '../PipelineProvisionStatus';
import { Estate } from '@ags/webclient-estates-core/types';
export interface ApplicationDetailProps {
    application?: Application;
    estate?: Estate;
}

const ApplicationDetail: FunctionComponent<ApplicationDetailProps> = ({
    application,
    estate,
}) => {
    const pipelineStatus = (status: string | undefined) => (
        <PipelineStatus status={status} />
    );
    const envName = (id: string | undefined) =>
        estate?.environments?.find((env) => env.id === id)?.name;
    return (
        <Stack>
            <Container title="General Information">
                <ColumnLayout renderDivider={true}>
                    <Column>
                        <Stack>
                            <KeyValuePair label="Name" value={application?.name} />
                            <KeyValuePair
                                label="Description"
                                value={application?.description}
                            />
                            <KeyValuePair
                                label="Application Owner"
                                value={application?.applicationOwner}
                            />
                        </Stack>
                    </Column>
                    <Column>
                        <Stack>
                            <KeyValuePair
                                label="Pipeline Provision Status"
                                value={pipelineStatus(
                                    application?.pipelineProvisionStatus
                                )}
                            />
                            <KeyValuePair
                                label="pipeline Provision Error"
                                value={application?.pipelineProvisionError}
                            />

                            <KeyValuePair
                                label="Estate"
                                value={estate?.name || application?.estateId}
                            />
                        </Stack>
                    </Column>
                    <Column>
                        <Stack>
                            <KeyValuePair
                                label="Created At"
                                value={
                                    application?.createTime &&
                                    formatDate(new Date(application.createTime))
                                }
                            />
                            <KeyValuePair
                                label="Last Updated At"
                                value={
                                    application?.lastUpdateTime &&
                                    formatDate(new Date(application.lastUpdateTime))
                                }
                            />
                            <KeyValuePair
                                label="Environments"
                                value={application?.environmentIds
                                    ?.map((id) => envName(id) || id)
                                    .join(', ')}
                            />
                        </Stack>
                    </Column>
                </ColumnLayout>
            </Container>

            <KeyValueTable
                tableName="Attributes"
                data={application?.attributes}
                disableCreate={true}
                disableRowSelect={true}
                disableToolbar={true}
                disableDelete={true}
            />
            <KeyValueTable
                tableName="Metadata"
                data={application?.metadata}
                disableCreate={true}
                disableRowSelect={true}
                disableToolbar={true}
                disableDelete={true}
            />
            <KeyValueTable
                tableName="Pipeline Data"
                data={application?.pipelineData}
                disableCreate={true}
                disableRowSelect={true}
                disableToolbar={true}
                disableDelete={true}
            />
        </Stack>
    );
};

export default ApplicationDetail;
