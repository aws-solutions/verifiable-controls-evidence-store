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
import Container from 'aws-northstar/layouts/Container';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import QueryContainerTemplate from '@ags/webclient-core/components/QueryContainerTemplate';
import { Estate } from '@ags/webclient-estates-core/types';
import { QueryType } from '@ags/webclient-estates-core/queries';
import { useAgsQuery } from '@ags/webclient-core/queries';

export interface EstateAssociationDetailsProps {
    entityId: string;
}

const EstateAssociationDetails: FunctionComponent<EstateAssociationDetailsProps> = ({
    entityId,
}) => {
    const {
        isLoading,
        data: estate,
        isError,
        error,
    } = useAgsQuery<Estate>(QueryType.GET_ESTATE, entityId);

    return (
        <Container title="Estate">
            <QueryContainerTemplate
                loading={isLoading}
                error={isError && error ? error : undefined}
                data={estate}
            >
                {(estate) => (
                    <Stack>
                        <KeyValuePair label="Name" value={estate?.name}></KeyValuePair>
                    </Stack>
                )}
            </QueryContainerTemplate>
        </Container>
    );
};
export default EstateAssociationDetails;
