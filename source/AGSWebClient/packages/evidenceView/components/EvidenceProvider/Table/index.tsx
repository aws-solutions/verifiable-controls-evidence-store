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
import Table, { Column } from 'aws-northstar/components/Table';
import { formatDate } from '@ags/webclient-core/utils/helpers';
import Link from 'aws-northstar/components/Link';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';
import Button from 'aws-northstar/components/Button';
import Inline from 'aws-northstar/layouts/Inline';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import { PERMISSION_EVIDENCE_PROVIDER_MANAGE } from '@ags/webclient-evidence-core/config/permissions';
import StatusIndicator from 'aws-northstar/components/StatusIndicator';
import { generatePath } from 'react-router-dom';
import { ROUTE_EVIDENCE_PROVIDER_DETAILS } from '@ags/webclient-evidence-core/config/routes';

interface EvidenceProviderTableProps {
    evidenceProviders?: EvidenceProvider[];
    onCreate?: () => void;
}

const getColumnDefinitions = (): Column<EvidenceProvider>[] => {
    return [
        {
            id: 'name',
            width: 150,
            Header: 'Provider name',
            accessor: 'name',
            Cell: ({ row }: any) => (
                <Link
                    href={generatePath(ROUTE_EVIDENCE_PROVIDER_DETAILS, {
                        providerId: row.original.providerId,
                    })}
                >
                    {row.original.name}
                </Link>
            ),
        },
        {
            id: 'description',
            width: 350,
            Header: 'Provider Description',
            accessor: 'description',
        },

        {
            id: 'enabled',
            width: 100,
            Header: 'Status',
            accessor: 'enabled',
            Cell: ({ row }: any) => {
                if (row && row.original) {
                    const enabled = row.original.enabled;
                    return (
                        <StatusIndicator statusType={enabled ? 'positive' : 'negative'}>
                            {enabled ? 'Active' : 'Inactive'}
                        </StatusIndicator>
                    );
                }
                return row.id;
            },
        },
        {
            id: 'createdTimestamp',
            width: 100,
            Header: 'Onboard Date Time',
            accessor: 'createdTimestamp',
            Cell: ({ row }: any) => {
                return formatDate(new Date(row.original?.createdTimestamp));
            },
        },
        {
            id: 'schemas',
            width: 50,
            Header: 'Number of Evidence Types',
            accessor: (row) => (row.schemas ? row.schemas.length : 0),
        },
    ];
};

const EvidenceProviderTable: FunctionComponent<EvidenceProviderTableProps> = ({
    evidenceProviders = [],
    onCreate,
}) => {
    const actionGroup = useMemo(
        () => (
            <Inline>
                <HasGroups groups={PERMISSION_EVIDENCE_PROVIDER_MANAGE}>
                    <Button variant={'primary'} onClick={onCreate}>
                        Create an Evidence Provider
                    </Button>
                </HasGroups>
            </Inline>
        ),
        [onCreate]
    );

    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions();
    }, []);

    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={`Evidence Providers`}
            items={evidenceProviders}
            actionGroup={actionGroup}
            multiSelect={false}
            sortBy={[{ id: 'createdTimestamp', desc: true }]}
            disableRowSelect={true}
        />
    );
};

export default EvidenceProviderTable;
