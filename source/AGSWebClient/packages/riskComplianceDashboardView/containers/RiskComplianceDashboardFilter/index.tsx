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
import {
    FunctionComponent,
    useMemo,
    useCallback,
    ChangeEvent,
    ReactNode,
    useEffect,
} from 'react';
import Select from 'aws-northstar/components/Select';
import Box from 'aws-northstar/layouts/Box';
import Badge from 'aws-northstar/components/Badge';
import FormField from 'aws-northstar/components/FormField';
import useUniqueId from 'aws-northstar/hooks/useUniqueId';
import ExpandableSection from 'aws-northstar/components/ExpandableSection';
import { EnvironmentClass } from '@ags/webclient-estates-core/types';
import { useAgsListQuery } from '@ags/webclient-core/queries';
import { QueryType as EstatesQueryType } from '@ags/webclient-estates-core/queries';

export interface EnvClassFilterProps {
    envClass?: string;
    setEnvClass?: (envClass: string) => void;
    /**
     * The environment classes that linked to the current entity
     */
    linkedEnvClasses?: string[];
}

const RiskComplianceDashboardFilter: FunctionComponent<EnvClassFilterProps> = ({
    envClass,
    setEnvClass,
    linkedEnvClasses,
}) => {
    const envClassControlId = useUniqueId();

    const { data, isLoading, isError, error } = useAgsListQuery<EnvironmentClass>(
        EstatesQueryType.LIST_ENVCLASSES
    );

    const options = useMemo(() => {
        return data
            ?.filter((d) => !linkedEnvClasses || linkedEnvClasses.includes(d.name))
            .map((ev) => ({
                label: `${ev.name} - ${ev.description}`,
                value: ev.name,
            }));
    }, [data, linkedEnvClasses]);

    useEffect(() => {
        if (!envClass && options && options.length > 0) {
            //Set the default envClass to prod
            setEnvClass?.(
                options.find((o) => o.value === 'prod') ? 'prod' : options?.[0].value
            );
        }
    }, [options, envClass, setEnvClass]);

    const handleChange = useCallback(
        (
            event: ChangeEvent<{ name?: string | undefined; value: unknown }>,
            _child: ReactNode
        ) => {
            setEnvClass?.(String(event.target.value));
        },
        [setEnvClass]
    );

    const header = useMemo(() => {
        const content = envClass
            ? `Environment Class: ${options?.find((o) => o.value === envClass)?.label}`
            : 'Loading';
        return (
            <Box>
                Filter: <Badge color="blue" content={content} />
            </Box>
        );
    }, [envClass, options]);

    return (
        <ExpandableSection header={header} variant="container">
            <Box display="flex" width="100%">
                <FormField label="Environment Class" controlId={envClassControlId}>
                    <Select
                        controlId={envClassControlId}
                        onChange={handleChange}
                        options={options}
                        statusType={
                            isLoading ? 'loading' : isError ? 'error' : 'finished'
                        }
                        selectedOption={envClass ? { value: envClass } : undefined}
                        errorText={error?.message}
                        placeholder="Select Environment Class"
                    />
                </FormField>
            </Box>
        </ExpandableSection>
    );
};

export default RiskComplianceDashboardFilter;
