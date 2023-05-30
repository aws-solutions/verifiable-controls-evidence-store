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
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout';
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
import {
    ROUTE_EVIDENCE_PROVIDER_DETAILS,
    ROUTE_EVIDENCE_REVISION_DETAIL,
    ROUTE_SCHEMA_DETAILS,
} from '@ags/webclient-evidence-core/config/routes';
import Table, { Column as TableColumn } from 'aws-northstar/components/Table';
import { generatePath, useHistory } from 'react-router-dom';

import { Evidence } from '@ags/webclient-evidence-core/types';
import ExpandableSection from 'aws-northstar/components/ExpandableSection';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import Link from 'aws-northstar/components/Link';
import ReactJson from 'react-json-view';
import Stack from 'aws-northstar/layouts/Stack';
import StatusIndicator from 'aws-northstar/components/StatusIndicator';
import Tabs from 'aws-northstar/components/Tabs';
import { formatDate } from '@ags/webclient-core/utils/helpers';

export interface EvidenceDetailProps {
    showRevisions: boolean;
    evidence?: Evidence;
    verified?: boolean;
    revisions?: Evidence[];
    onDownloadClicked?: (attachmentId: string) => void;
    revisionId?: string;
}

const EvidenceDetail: FunctionComponent<EvidenceDetailProps> = ({
    showRevisions,
    evidence,
    verified,
    revisions,
    revisionId,
    onDownloadClicked,
}) => {
    let header = `Evidence Details - ${evidence?.evidenceId} `;
    if (revisionId) {
        header += ` - Revision ${revisionId}`;
    }
    const history = useHistory();

    const attachmentTableDefinition: TableColumn<any>[] = useMemo(() => {
        return [
            {
                id: 'objectKey',
                width: 700,
                Header: 'File Name',
                accessor: 'fileName',
                Cell: ({ row }: any) => {
                    return (
                        <Link
                            onClick={() => onDownloadClicked?.(row.original.attachmentId)}
                            href="#"
                        >
                            {
                                row.original.objectKey.split('/')[
                                    row.original.objectKey.split('/').length - 1
                                ]
                            }
                        </Link>
                    );
                },
            },
            {
                id: 'fileSize',
                Header: 'File Size',
                accessor: 'size',
                Cell: ({ row }: any) => {
                    if (!row.original.size) {
                        return '';
                    }

                    const size: any = row.original.size;

                    const i =
                        size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));

                    return `${(size / Math.pow(1024, i)).toFixed(2)} ${
                        ['B', 'kB', 'MB', 'GB', 'TB'][i]
                    }`;
                },
            },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const revisionTableDefinition: TableColumn<Evidence>[] = useMemo(() => {
        return [
            {
                id: 'version',
                width: 200,
                Header: 'Revision Version',
                accessor: 'version',
                Cell: ({ row }: any) => (
                    <Link
                        href={`/evidences/${evidence?.evidenceId}/revisions/${row.original.version}`}
                        onClick={() =>
                            history.push(
                                generatePath(ROUTE_EVIDENCE_REVISION_DETAIL, {
                                    evidenceId: evidence?.evidenceId!,
                                    revisionId: row.original.version,
                                })
                            )
                        }
                    >
                        {row.original.version + 1 === revisions?.length ? (
                            <strong>current</strong>
                        ) : (
                            row.original.version
                        )}
                    </Link>
                ),
            },
            {
                id: 'createdTimestamp',
                width: 200,
                Header: 'Created at',
                accessor: 'createdTimestamp',
                Cell: ({ row }: any) => {
                    return formatDate(new Date(row.original?.createdTimestamp));
                },
            },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tabs = useMemo(
        () => [
            {
                label: `Attachments - (${evidence?.attachments?.length ?? 0})`,
                id: 'first',
                content: (
                    <Table
                        columnDefinitions={attachmentTableDefinition}
                        items={evidence?.attachments}
                        disableColumnFilters={true}
                        disableExpand={true}
                        disableRowSelect={true}
                    ></Table>
                ),
            },
            {
                label: 'Metadata',
                id: 'second',
                content: evidence?.metadata ? (
                    <ReactJson
                        src={evidence?.metadata as Object}
                        displayDataTypes={false}
                        style={{ fontSize: '14px' }}
                    ></ReactJson>
                ) : (
                    <></>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return (
        <Stack>
            <ExpandableSection header={header} variant="container" expanded={true}>
                <ColumnLayout>
                    <Column>
                        <Stack>
                            <KeyValuePair
                                label="Provider"
                                value={
                                    <Link
                                        href={generatePath(
                                            ROUTE_EVIDENCE_PROVIDER_DETAILS,
                                            { providerId: evidence?.providerId! }
                                        )}
                                    >
                                        {evidence?.providerName ?? evidence?.providerId}
                                    </Link>
                                }
                            />
                            <KeyValuePair label="Target Id" value={evidence?.targetId} />
                            <KeyValuePair
                                label="Status"
                                value={
                                    verified ? (
                                        <StatusIndicator statusType={'positive'}>
                                            Verified
                                        </StatusIndicator>
                                    ) : (
                                        <StatusIndicator statusType={'negative'}>
                                            Unverified
                                        </StatusIndicator>
                                    )
                                }
                            />
                        </Stack>
                    </Column>
                    <Column>
                        <Stack>
                            <KeyValuePair
                                label="Evidence Type"
                                value={
                                    <Link
                                        href={generatePath(ROUTE_SCHEMA_DETAILS, {
                                            providerId: evidence?.providerId!,
                                            schemaId: evidence?.schemaId!,
                                        })}
                                    >
                                        {evidence?.schemaId}
                                    </Link>
                                }
                            />
                            <KeyValuePair
                                label="Additional Target Ids"
                                value={evidence?.additionalTargetIds?.join(', ')}
                            />
                            <KeyValuePair
                                label="Created At"
                                value={
                                    evidence
                                        ? formatDate(new Date(evidence.createdTimestamp))
                                        : ''
                                }
                            />
                        </Stack>
                    </Column>
                </ColumnLayout>
            </ExpandableSection>

            <ExpandableSection
                header={'Evidence content'}
                variant={'container'}
                expanded={true}
            >
                <ReactJson
                    src={evidence?.content as Object}
                    displayDataTypes={false}
                    style={{ fontSize: '14px' }}
                />
            </ExpandableSection>

            <Tabs tabs={tabs}></Tabs>

            {showRevisions ? (
                <Table
                    columnDefinitions={revisionTableDefinition}
                    items={revisions?.sort(
                        (a, b) =>
                            new Date(b.createdTimestamp).getTime() -
                            new Date(a.createdTimestamp).getTime()
                    )}
                    disableColumnFilters={true}
                    disableExpand={true}
                    disableRowSelect={true}
                    tableTitle={`Revisions - (${revisions?.length})`}
                    disableFilters={true}
                ></Table>
            ) : (
                <></>
            )}
        </Stack>
    );
};

export default EvidenceDetail;
