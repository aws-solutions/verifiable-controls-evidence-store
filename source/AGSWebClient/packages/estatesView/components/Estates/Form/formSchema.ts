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
import { componentTypes, validatorTypes } from 'aws-northstar/components/FormRenderer';
import { SelectOption } from 'aws-northstar/components/Select';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';
import { EnvironmentClass } from '@ags/webclient-estates-core/types';

/** form schema describing the new estate form */
export const getFormSchema = (
    businessUnits?: BusinessUnitSummary[],
    envClasses?: EnvironmentClass[]
) => {
    const options = businessUnits
        ? businessUnits.map<SelectOption>((item) => {
              return {
                  label: item.name,
                  value: item.id,
              };
          })
        : [];

    const envClassOptions = envClasses
        ? envClasses.map<SelectOption>((item) => {
              return {
                  label: item.name,
                  value: item.name,
              };
          })
        : [];

    return {
        header: 'Add a new Estate',
        description:
            'An AWS Governance Suite Estate is a collection of environments into which application can be deployed.',
        fields: [
            {
                component: componentTypes.SUB_FORM,
                title: 'Estate details',
                name: 'estateDetailsSubform',
                description:
                    'Please provide detail about the estate for which you want to deploy your application.',
                fields: [
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'name',
                        label: 'Estate name',
                        description: 'The name of your estate',
                        validate: [
                            {
                                type: validatorTypes.REQUIRED,
                                message: 'Please enter an estate name',
                            },
                            {
                                type: validatorTypes.MIN_LENGTH,
                                threshold: 3,
                                message:
                                    'An estate name must be at least 3 characters long.',
                            },
                            {
                                type: validatorTypes.MAX_LENGTH,
                                threshold: 128,
                                message:
                                    'An estate name must be no more than 128 characters long.',
                            },
                        ],
                    },
                    {
                        component: componentTypes.SELECT,
                        name: 'parentBUId',
                        label: 'Business unit',
                        description: 'The business unit this estate belongs to',
                        options,
                        validate: [
                            {
                                type: validatorTypes.REQUIRED,
                                message: 'Please choose an business unit',
                            },
                        ],
                    },
                    {
                        component: componentTypes.TEXT_FIELD,
                        name: 'toolingAccountId',
                        label: 'Tooling account number',
                        description: 'The AWS account number for tooling account',
                        validate: [
                            {
                                type: validatorTypes.REQUIRED,
                                message: 'Please enter a valid AWS Account number',
                            },
                            // {
                            //     type: validatorTypes.MIN_LENGTH,
                            //     threshold: 3,
                            //     message:
                            //         'An estate name must be at least 3 characters long.',
                            // },
                            // {
                            //     type: validatorTypes.MAX_LENGTH,
                            //     threshold: 128,
                            //     message:
                            //         'An estate name must be no more than 128 characters long.',
                            // },
                        ],
                    },
                ],
            },
            {
                component: componentTypes.SUB_FORM,
                title: 'Environments',
                description: 'Environments included in this estate',
                name: 'environmentsSubform',
                fields: [
                    {
                        component: componentTypes.FIELD_ARRAY,
                        name: 'environments',
                        helperText: 'You can add up to 9 environments.',
                        maxItems: 9,
                        fields: [
                            {
                                component: componentTypes.TEXT_FIELD,
                                name: 'name',
                                label: 'Name',
                                validate: [
                                    {
                                        type: validatorTypes.REQUIRED,
                                    },
                                ],
                            },
                            {
                                component: componentTypes.TEXT_FIELD,
                                name: 'awsAccountId',
                                label: 'AWS Account Number',
                                validate: [
                                    {
                                        type: validatorTypes.REQUIRED,
                                    },
                                ],
                            },
                            {
                                component: componentTypes.SELECT,
                                name: 'envClass',
                                label: 'Environment Class',
                                isRequired: true,
                                options: envClassOptions,
                                validate: [
                                    {
                                        type: validatorTypes.REQUIRED,
                                    },
                                ],
                            },
                            {
                                component: componentTypes.SELECT,
                                name: 'isManualApprovalRequired',
                                label: 'Manual Approval',
                                initialValue: false,
                                options: [
                                    {
                                        label: 'Not Required',
                                        value: false,
                                    },
                                    {
                                        label: 'Required',
                                        value: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                component: componentTypes.CHECKBOX,
                name: 'consent',
                stretch: true,
                label: 'I understand the permissions AWS Governance Suite will use to administer AWS resources and enforce rules on my behalf. I also understand the guidance on the use of AWS Governance Suite  and the underlying AWS resources.',
                validate: [
                    {
                        type: validatorTypes.REQUIRED,
                        message: 'You must accept to continue',
                    },
                ],
            },
        ],
    };
};
