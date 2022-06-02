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
import Stack from 'aws-northstar/layouts/Stack';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import ExpandableSection from 'aws-northstar/components/ExpandableSection';
import { ApplicationFormData } from '../../types';
import Table from 'aws-northstar/components/Table';
import Box from 'aws-northstar/layouts/Box';

const ApplicationReview: FunctionComponent<{ data: ApplicationFormData }> = ({
    data,
}) => {
    const environmentsColumnDefs: any[] = [
        {
            id: 'label',
            width: 400,
            Header: 'Environments',
            accessor: 'label',
        },
    ];
    const keyValueColumnDefs: any[] = [
        {
            id: 'key',
            width: 400,
            Header: 'Key',
            accessor: 'key',
        },
        {
            id: 'value',
            width: 400,
            Header: 'Value',
            accessor: 'value',
        },
    ];

    return (
        <Stack>
            <ExpandableSection header="General Information" expanded={true}>
                <Box width="100%">
                    <Stack>
                        <KeyValuePair label="Name" value={data.name} />
                        <KeyValuePair label="Description" value={data.description} />
                        <KeyValuePair
                            label="Application Owner"
                            value={data.applicationOwner}
                        />
                        <KeyValuePair label="Estate" value={data.estate.split(':')[0]} />
                        <Table
                            columnDefinitions={environmentsColumnDefs}
                            items={data.environments}
                            disableGroupBy={true}
                            disableSettings={true}
                            disablePagination={true}
                            disableFilters={true}
                            disableRowSelect={true}
                            disableSortBy={true}
                        />
                    </Stack>
                </Box>
            </ExpandableSection>
            <ExpandableSection
                header={`Attributes (${data.attributes?.length || 0})`}
                expanded={true}
            >
                <Box width="100%">
                    <Table
                        columnDefinitions={keyValueColumnDefs}
                        items={data.attributes}
                        disableGroupBy={true}
                        disableSettings={true}
                        disablePagination={true}
                        disableFilters={true}
                        disableRowSelect={true}
                        sortBy={[
                            {
                                id: 'key',
                                desc: false,
                            },
                        ]}
                    />
                </Box>
            </ExpandableSection>

            {data.metadata && data.metadata.length > 0 && (
                <ExpandableSection
                    header={`Metadatda (${data.metadata?.length || 0})`}
                    expanded={true}
                >
                    <Box width="100%">
                        <Table
                            columnDefinitions={keyValueColumnDefs}
                            items={data.metadata}
                            disableGroupBy={true}
                            disableSettings={true}
                            disablePagination={true}
                            disableFilters={true}
                            disableRowSelect={true}
                            sortBy={[
                                {
                                    id: 'key',
                                    desc: false,
                                },
                            ]}
                        />
                    </Box>
                </ExpandableSection>
            )}
        </Stack>
    );
};

export default ApplicationReview;
