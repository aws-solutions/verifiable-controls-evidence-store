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
import FormRenderer from 'aws-northstar/components/FormRenderer';
import { BusinessUnitSummary } from '@ags/webclient-business-units-core/types';

/** import the form schema */
import { getFormSchema } from './formSchema';
import { EnvironmentClass, CreateEstateParams } from '@ags/webclient-estates-core/types';

/**
 * Estate for props
 *
 * @export
 * @interface EstateFormProps
 */
export interface EstateFormProps {
    initialValues?: CreateEstateParams;
    businessUnits?: BusinessUnitSummary[];
    envClasses?: EnvironmentClass[];
    onSubmit: (values: Record<string, any>) => void;
    onCancel: () => void;
    isUpdate?: boolean;
}

const EstateForm: FunctionComponent<EstateFormProps> = ({
    onSubmit,
    onCancel,
    initialValues,
    businessUnits,
    envClasses,
}) => {
    const schema = useMemo(
        () => getFormSchema(businessUnits, envClasses),
        [businessUnits, envClasses]
    );

    return (
        <FormRenderer
            schema={schema}
            onSubmit={onSubmit}
            onCancel={onCancel}
            initialValues={initialValues}
        />
    );
};

export default EstateForm;
