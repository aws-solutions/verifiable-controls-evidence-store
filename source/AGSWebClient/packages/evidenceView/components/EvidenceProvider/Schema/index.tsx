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
import { generatePath, useHistory } from 'react-router-dom';
import Table, { Column } from 'aws-northstar/components/Table';
import Link from 'aws-northstar/components/Link';
import { EvidenceProvider, SchemaId } from '@ags/webclient-evidence-core/types';
import {
    ROUTE_CREATE_SCHEMA,
    ROUTE_SCHEMA_DETAILS,
} from '@ags/webclient-evidence-core/config/routes';
import Inline from 'aws-northstar/layouts/Inline';
import HasGroups from '@ags/webclient-core/components/HasGroups';
import Button from 'aws-northstar/components/Button';
import { PERMISSION_EVIDENCE_PROVIDER_MANAGE } from '@ags/webclient-evidence-core/config/permissions';

export interface EvidenceProviderProps {
    evidenceProvider?: EvidenceProvider;
}

const getColumnDefinitions = (providerId: string | undefined): Column<SchemaId>[] => {
    return [
        {
            id: 'schemaId',
            width: 350,
            Header: 'Schema name',
            accessor: 'schemaId',
            Cell: ({ row }: any) => (
                <Link
                    href={generatePath(ROUTE_SCHEMA_DETAILS, {
                        providerId: providerId!,
                        schemaId: row.original.schemaId,
                    })}
                >
                    {row.original.schemaId}
                </Link>
            ),
        },
    ];
};

const EvidenceProviderSchemaTable: FunctionComponent<EvidenceProviderProps> = ({
    evidenceProvider,
}) => {
    const history = useHistory();

    const actionGroup = useMemo(
        () => (
            <Inline>
                <HasGroups groups={PERMISSION_EVIDENCE_PROVIDER_MANAGE}>
                    <Button
                        variant={'primary'}
                        onClick={() => {
                            history.push(
                                generatePath(ROUTE_CREATE_SCHEMA, {
                                    providerId: evidenceProvider?.providerId!,
                                })
                            );
                        }}
                    >
                        Add a new schema
                    </Button>
                </HasGroups>
            </Inline>
        ),
        [history, evidenceProvider]
    );
    const columnDefinitions = useMemo(() => {
        return getColumnDefinitions(evidenceProvider?.providerId);
    }, [evidenceProvider]);

    return (
        <Table
            columnDefinitions={columnDefinitions}
            tableTitle={`Schema List`}
            items={evidenceProvider?.schemas}
            multiSelect={false}
            sortBy={[{ id: 'schemaId', desc: true }]}
            actionGroup={actionGroup}
        />
    );
};

export default EvidenceProviderSchemaTable;
