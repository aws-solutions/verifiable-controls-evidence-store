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

import { useMemo, FunctionComponent } from 'react';
import FormRenderer from 'aws-northstar/components/FormRenderer';
import { EvidenceProvider } from '@ags/webclient-evidence-core/types';
import { dateValidators, getEvidenceSearchFormSchema } from './searchFormSchema';

export interface EvidenceSearchFormProps {
    refresh?: boolean;
    evidenceProviders?: EvidenceProvider[];
    onSearch?: (formData: Record<string, any>) => void;
    initialValues?: Record<string, any>;
    isSubmitting: boolean;
}

const EvidenceSearchForm: FunctionComponent<EvidenceSearchFormProps> = (
    props: EvidenceSearchFormProps
) => {
    const schema = useMemo(() => {
        return getEvidenceSearchFormSchema(props.evidenceProviders);
    }, [props.evidenceProviders]);

    return (
        <FormRenderer
            schema={schema}
            onSubmit={(data) => {
                props.onSearch?.(data);
            }}
            initialValues={props.initialValues}
            isSubmitting={props.isSubmitting}
            validatorMapper={dateValidators}
        ></FormRenderer>
    );
};

export default EvidenceSearchForm;
