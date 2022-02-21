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
import FormRenderer, {
    componentTypes,
    validatorTypes,
    Field,
} from 'aws-northstar/components/FormRenderer';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';

export interface BusinessUnitFormData {
    name: string;
    description?: string;
    parentId?: string;
    parentName?: string;
    businessOwner?: string;
    riskOwner?: string;
    techOwner?: string;
}

export interface BusinessUnitFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isUpdate?: boolean;
    isEnterprise?: boolean;
    initialValues?: BusinessUnitFormData;
    businessUnits?: BusinessUnitSummary[];
}

const BusinessUnitForm: FunctionComponent<BusinessUnitFormProps> = ({
    onSubmit,
    onCancel,
    isUpdate = false,
    isEnterprise = false,
    initialValues = {},
    businessUnits,
}) => {
    const parentControl = useMemo(
        () =>
            businessUnits
                ? {
                      component: componentTypes.SELECT,
                      name: 'parentId',
                      label: 'Parent Business Unit',
                      isRequired: true,
                      options: businessUnits.map((item) => ({
                          label: item.name,
                          value: item.id,
                      })),
                  }
                : {
                      component: componentTypes.TEXT_FIELD,
                      name: 'parentName',
                      label: 'Parent Business Unit',
                      isRequired: true,
                      isDisabled: true,
                  },
        [businessUnits]
    );
    const schema = useMemo(() => {
        const entityName = isEnterprise ? 'Enterprise' : 'Business Unit';
        const headerText = isUpdate ? `Update ${entityName}` : `Create ${entityName}`;
        const fields: Field[] = isEnterprise ? [] : [parentControl];
        fields.push(
            {
                component: componentTypes.TEXT_FIELD,
                name: 'name',
                label: 'Name',
                isRequired: true,
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
                name: 'businessOwner',
                label: 'Business Owner',
                isRequired: true,
            },
            {
                component: componentTypes.TEXT_FIELD,
                name: 'riskOwner',
                label: 'Risk Owner',
                isRequired: true,
            },
            {
                component: componentTypes.TEXT_FIELD,
                name: 'techOwner',
                label: 'Tech Owner',
                isRequired: true,
            }
        );

        return {
            header: headerText,
            fields,
        };
    }, [isUpdate, isEnterprise, parentControl]);

    return (
        <FormRenderer
            schema={schema}
            onSubmit={onSubmit}
            onCancel={onCancel}
            initialValues={initialValues}
        />
    );
};

export default BusinessUnitForm;
