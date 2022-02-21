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
import { render } from '@testing-library/react';
import { FunctionComponent } from 'react';
import ProcessorList, { ProcessorProps } from './index';

type SettingType = {
    settingValue: number;
};
const DummyProcessor: FunctionComponent<ProcessorProps<SettingType[]>> = ({
    settings,
    children,
}) => {
    const newSettings = [{ settingValue: settings[0].settingValue + 1 }];
    return children(newSettings);
};

describe('ProcessorList', () => {
    test('no processor', () => {
        const { getByText } = render(
            <ProcessorList Processors={[]} settings={[{ settingValue: 1 }]}>
                {(newSettings) => <>Test Text {newSettings[0].settingValue}</>}
            </ProcessorList>
        );
        expect(getByText('Test Text 1')).toBeInTheDocument();
    });

    test('single processor', () => {
        const { getByText } = render(
            <ProcessorList Processors={[DummyProcessor]} settings={[{ settingValue: 1 }]}>
                {(newSettings) => <>Test Text {newSettings[0].settingValue}</>}
            </ProcessorList>
        );
        expect(getByText('Test Text 2')).toBeInTheDocument();
    });

    test('double processors', () => {
        const { getByText } = render(
            <ProcessorList
                Processors={[DummyProcessor, DummyProcessor]}
                settings={[{ settingValue: 1 }]}
            >
                {(newSettings) => <>Test Text {newSettings[0].settingValue}</>}
            </ProcessorList>
        );
        expect(getByText('Test Text 3')).toBeInTheDocument();
    });
});
