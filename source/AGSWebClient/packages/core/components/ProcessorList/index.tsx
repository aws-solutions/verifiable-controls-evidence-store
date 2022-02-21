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
import { ComponentType, ReactElement } from 'react';

export interface ProcessorProps<T> {
    settings: T;
    children: (newSettings: T) => ReactElement;
}

export interface ProcessorListProps<T> extends ProcessorProps<T> {
    Processors: ComponentType<ProcessorProps<T>>[];
}

const ProcessorList = <T,>({ Processors, settings, children }: ProcessorListProps<T>) => {
    if (Processors.length === 0) {
        return children(settings);
    }

    const CurrentProcessor = Processors[0];
    if (Processors.length === 1) {
        return (
            <CurrentProcessor settings={settings}>
                {(updatedSettings) => children(updatedSettings)}
            </CurrentProcessor>
        );
    }

    return (
        <CurrentProcessor settings={settings}>
            {(updatedSettings) => (
                <ProcessorList
                    Processors={Processors.slice(1)}
                    settings={updatedSettings}
                    children={children}
                />
            )}
        </CurrentProcessor>
    );
};

export default ProcessorList;
