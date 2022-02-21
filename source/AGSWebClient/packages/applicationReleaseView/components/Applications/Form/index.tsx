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
import { FunctionComponent, useMemo, useRef } from 'react';
import FormRenderer, {
    componentTypes,
    validatorTypes,
} from 'aws-northstar/components/FormRenderer';
import { AttributeSummary, Estate } from '@ags/webclient-application-release-core/types';
import ApplicationsReview from './components/Review';
import { ApplicationFormData } from './types';

export interface ApplicationFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isUpdate?: boolean;
    initialValues?: ApplicationFormData;
    attributes: { [key: string]: AttributeSummary[] };
    estates: Estate[];
}

const ApplicationForm: FunctionComponent<ApplicationFormProps> = ({
    onSubmit,
    onCancel,
    isUpdate = false,
    initialValues = {
        name: '',
        applicationOwner: '',
        estate: '',
        environments: [],
        attributes: [],
    },
    attributes = {},
    estates = [],
}: ApplicationFormProps) => {
    // estate to environment map
    const estateToEnvironmentMap = useMemo(() => {
        const estateToEnvMap: { [key: string]: any } = {};
        estates.forEach((estate) => {
            const environments = estate.environments
                .map((environment) => ({
                    label: environment.name,
                    value: environment.id,
                }))
                .sort((env1, env2) =>
                    env1.label > env2.label ? 1 : env1.label < env2.label ? -1 : 0
                );
            estateToEnvMap[estate.id] = environments;
        });
        return estateToEnvMap;
    }, [estates]);

    const previousEstateValueRef = useRef('');
    const previousAttributeKeysRef = useRef(['']);

    // Application Details sub form
    const detailsSubForm = useMemo(() => {
        return {
            name: 'applicationDetails',
            title: 'Application Details',
            fields: [
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'name',
                    label: 'Name',
                    isRequired: true,
                    isReadOnly: isUpdate,
                    validate: [
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                },
                {
                    component: componentTypes.TEXTAREA,
                    name: 'description',
                    label: 'Description',
                    isRequired: true,
                    validate: [
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                },
                {
                    component: componentTypes.TEXT_FIELD,
                    name: 'applicationOwner',
                    label: 'Application Owner',
                    isRequired: true,
                    validate: [
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                },
                {
                    component: componentTypes.SELECT,
                    name: 'estate',
                    label: 'Estate',
                    isRequired: true,
                    isReadOnly: isUpdate,
                    validate: [
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                    resolveProps: (_props: any, _field: any, formOptions: any) => {
                        const currentSelectedEstateValue =
                            formOptions.getState().values.estate;
                        // on estate change, clear the environments selection
                        if (
                            previousEstateValueRef.current &&
                            previousEstateValueRef.current !== currentSelectedEstateValue
                        ) {
                            formOptions.change('environments', []);
                        }
                        previousEstateValueRef.current = currentSelectedEstateValue;
                        return {
                            options: estates
                                .map((estate) => ({
                                    label: estate.name,
                                    value: `${estate.name}:${estate.id}`,
                                }))
                                .sort((estate1, estate2) =>
                                    estate1.label > estate2.label
                                        ? 1
                                        : estate1.label < estate2.label
                                        ? -1
                                        : 0
                                ),
                        };
                    },
                },
                {
                    component: componentTypes.SELECT,
                    name: 'environments',
                    label: 'Environments (To be selected in the order of deployment)',
                    isRequired: true,
                    multiSelect: true,
                    validate: [
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                    resolveProps: (_props: any, _field: any, formOptions: any) => {
                        const selectedEstate = formOptions.getState().values.estate;
                        const estateId = selectedEstate
                            ? selectedEstate.split(':')[1]
                            : undefined;
                        return {
                            options: estateToEnvironmentMap[estateId],
                        };
                    },
                },
            ],
        };
    }, [estateToEnvironmentMap, estates, isUpdate]);

    // Select attributes sub form
    const attributesSubForm = useMemo(() => {
        const mandatoryAttributeKeys = Object.entries(attributes)
            .filter(([, value]) => value[0].isMandatory)
            .map((item) => item[0]);
        // Regex to get the index of the selected field in the field array
        const regexFieldArrayIndex = /\[(-?\d+)\]/;

        return {
            name: 'Attributes',
            title: 'Select Attribute',
            fields: [
                {
                    component: componentTypes.FIELD_ARRAY,
                    name: 'attributes',
                    minItems: mandatoryAttributeKeys.length,
                    maxItems: Object.keys(attributes).length,
                    validate: [
                        {
                            type: validatorTypes.MIN_ITEMS,
                            threshold: mandatoryAttributeKeys.length,
                            message: `Please select atleast ${mandatoryAttributeKeys.length} attributes: ${mandatoryAttributeKeys}`,
                        },
                        {
                            type: validatorTypes.REQUIRED,
                        },
                    ],
                    fields: [
                        {
                            component: componentTypes.SELECT,
                            label: 'Attribute Key',
                            name: 'key',
                            dataType: 'string',
                            validate: [{ type: validatorTypes.REQUIRED }],
                            resolveProps: (
                                _props: any,
                                field: any,
                                formOptions: any
                            ): any => {
                                const inputFieldName = field.input.name;
                                const currentIndex = parseInt(
                                    inputFieldName.match(regexFieldArrayIndex)[1]
                                );
                                const currentSelectedAttributeKey =
                                    formOptions.getState().values.attributes[currentIndex]
                                        .key;
                                // on attribute key change, clear the attribute value selection
                                if (
                                    previousAttributeKeysRef.current[currentIndex] &&
                                    previousAttributeKeysRef.current[currentIndex] !==
                                        currentSelectedAttributeKey
                                ) {
                                    formOptions.change(
                                        `attributes[${currentIndex}].value`,
                                        []
                                    );
                                }
                                previousAttributeKeysRef.current[currentIndex] =
                                    currentSelectedAttributeKey;
                                // currently selected attribute keys. Exclude the one which is currently in focus
                                const currentSelectedAttrKeys = formOptions
                                    .getState()
                                    .values.attributes.filter(
                                        (item: any) =>
                                            item.key !== currentSelectedAttributeKey
                                    )
                                    .map((item: any) => item.key);
                                return {
                                    options: Object.keys(attributes)
                                        .filter(
                                            (item) =>
                                                !currentSelectedAttrKeys.includes(item)
                                        )
                                        .sort((attr1, attr2) =>
                                            attr1 > attr2 ? 1 : attr2 > attr1 ? -1 : 0
                                        )
                                        .map((item) => ({
                                            label: item,
                                            value: item,
                                        })),
                                };
                            },
                        },
                        {
                            component: componentTypes.SELECT,
                            label: 'Attribute Value',
                            name: 'value',
                            dataType: 'string',
                            validate: [{ type: validatorTypes.REQUIRED }],
                            resolveProps: (
                                _props: any,
                                field: any,
                                formOptions: any
                            ): any => {
                                const inputFieldName = field.input.name;
                                const currentIndex = parseInt(
                                    inputFieldName.match(regexFieldArrayIndex)[1]
                                );
                                const attr =
                                    formOptions.getState().values.attributes[
                                        currentIndex
                                    ];
                                return {
                                    options: attr.key
                                        ? attributes[attr.key].map((item) => ({
                                              label: item.value,
                                              value: item.value,
                                          }))
                                        : undefined,
                                };
                            },
                        },
                    ],
                },
            ],
        };
    }, [attributes]);

    // Metadata subform
    const metadataSubForm = useMemo(() => {
        return {
            title: 'Application Metadata',
            name: 'metadataForm',
            fields: [
                {
                    component: componentTypes.FIELD_ARRAY,
                    name: 'metadata',
                    fields: [
                        {
                            component: componentTypes.TEXT_FIELD,
                            label: 'Key',
                            name: 'key',
                            dataType: 'string',
                            validate: [
                                { type: validatorTypes.REQUIRED },
                                {
                                    type: validatorTypes.PATTERN,
                                    pattern: /^(?!aws:)[a-zA-Z+-=._:/]{1,128}$/,
                                },
                            ],
                        },
                        {
                            component: componentTypes.TEXT_FIELD,
                            label: 'Value',
                            name: 'value',
                            dataType: 'string',
                            validate: [
                                { type: validatorTypes.REQUIRED },
                                {
                                    type: validatorTypes.PATTERN,
                                    pattern: /^[\w\p{L}\p{Z}\p{N}_.:/=+\-@]{1,256}$/,
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }, []);

    // Review page
    const schema = useMemo(() => {
        return {
            header: isUpdate ? 'Update Application' : 'Create Application',
            fields: [
                {
                    component: componentTypes.WIZARD,
                    name: 'CreateApplicationWizard',
                    fields: [
                        detailsSubForm,
                        attributesSubForm,
                        metadataSubForm,
                        {
                            name: 'review',
                            title: 'Review',
                            fields: [
                                {
                                    component: componentTypes.REVIEW,
                                    name: 'review',
                                    Template: ApplicationsReview,
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }, [attributesSubForm, detailsSubForm, metadataSubForm, isUpdate]);

    return (
        <FormRenderer
            schema={schema}
            onSubmit={onSubmit}
            onCancel={onCancel}
            initialValues={initialValues}
        />
    );
};

export type { ApplicationFormData };

export default ApplicationForm;
