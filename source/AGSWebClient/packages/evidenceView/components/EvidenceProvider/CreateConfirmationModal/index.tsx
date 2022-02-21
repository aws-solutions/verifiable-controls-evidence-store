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
import Button from 'aws-northstar/components/Button';
import Modal from 'aws-northstar/components/Modal';
import Box from 'aws-northstar/layouts/Box';
import Inline from 'aws-northstar/layouts/Inline';
import Stack from 'aws-northstar/layouts/Stack';
import Text from 'aws-northstar/components/Text';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';

export interface CreateConfirmationViewModel {
    evidenceProviderName: string;
    evidenceProviderId: string;
    apiKey: string;
}

export interface CreateConfirmationModalProps {
    evidenceProvider?: CreateConfirmationViewModel;
    visible: boolean;
    setVisible: (visible: boolean) => void;
    onDismissed: () => void;
}

const CreateConfirmationModal: FunctionComponent<CreateConfirmationModalProps> = ({
    evidenceProvider,
    visible,
    onDismissed,
    setVisible,
}) => {
    return (
        <Modal
            title={'Successfully onboarded a new evidence provider'}
            visible={visible}
            onClose={() => {
                setVisible(false);
                onDismissed();
            }}
        >
            <Stack>
                <Text>
                    Your new evidence provider details are provided below. Please include
                    the evidence provider id and API Key in your request when creating new
                    evidences.
                </Text>
                <KeyValuePair
                    label={'Evidence Provider Id'}
                    value={evidenceProvider?.evidenceProviderId}
                />
                <KeyValuePair
                    label={'Evidence Provider Name'}
                    value={evidenceProvider?.evidenceProviderName}
                />
                <KeyValuePair label={'API Key'} value={evidenceProvider?.apiKey} />
                <Box display="flex" justifyContent="flex-end">
                    <Box p={1}>
                        <Inline>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setVisible(false);
                                    onDismissed();
                                }}
                            >
                                OK
                            </Button>
                        </Inline>
                    </Box>
                </Box>
            </Stack>
        </Modal>
    );
};

export default CreateConfirmationModal;
