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
    componentTypes,
    Schema,
    validatorTypes,
} from 'aws-northstar/components/FormRenderer';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';

export const dateValidators = {
    validDate: () => (value: any) => {
        if (!value) {
            return undefined;
        }

        return new Date(value) < new Date() ? undefined : 'Date cannot be in the future.';
    },
    endDate: () => (_: any, formValues: any) => {
        const endTimestamp = formValues.searchForm?.endTimestamp;
        const startTimestamp = formValues.searchForm?.startTimestamp;

        if (endTimestamp && startTimestamp) {
            return new Date(endTimestamp) >= new Date(startTimestamp)
                ? undefined
                : 'End date cannot be before start date.';
        }

        return undefined;
    },
};

export const getEvidenceSearchFormSchema = (providers?: EvidenceProvider[]) => {
    return {
        fields: [
            {
                component: componentTypes.EXPANDABLE_SECTION,
                title: 'Evidence Search',
                name: 'searchForm',
                variant: 'container',
                fields: [
                    {
                        component: componentTypes.SELECT,
                        name: 'providerId',
                        dataType: 'string',
                        label: 'Evidence provider',
                        options: providers?.map((x) => {
                            return { label: x.name, value: x.providerId };
                        }),
                    },
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'schemaId',
                        dataType: 'string',
                        label: 'Evidence schema id',
                        validate: [{ type: validatorTypes.MAX_LENGTH, threshold: 128 }],
                    },
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'content',
                        dataType: 'string',
                        label: 'Evidence content',
                    },
                    {
                        component: componentTypes.FIELD_ARRAY,
                        label: 'Evidence target ids',
                        name: 'targetIds',
                        fields: [
                            {
                                component: componentTypes.TEXT_FIELD,
                                name: 'value',
                                dataType: 'string',
                                validate: [
                                    { type: validatorTypes.MAX_LENGTH, threshold: 128 },
                                ],
                            },
                        ],
                        maxItems: 5,
                    },
                    {
                        component: componentTypes.DATE_PICKER,
                        label: 'Start date',
                        name: 'startTimestamp',
                        validate: [{ type: 'validDate' }],
                    },
                    {
                        component: componentTypes.DATE_PICKER,
                        label: 'End date',
                        name: 'endTimestamp',
                        validate: [{ type: 'validDate' }, { type: 'endDate' }],
                    },
                ],
            },
        ],
        submitLabel: 'Search',
        canReset: true,
        canCancel: false,
    } as Schema;
};
