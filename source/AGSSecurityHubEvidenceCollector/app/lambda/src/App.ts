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

import { SQSEvent, SQSRecord } from 'aws-lambda';
import { SecurityHubEventProcessor } from './SecurityHubEventProcessor';
import { Message } from './common/Types';
import { ConfigEventProcessor } from './ConfigEventProcessor';
import * as xray from 'aws-xray-sdk';

xray.captureHTTPsGlobal(require('https'));

export interface SQSEventProcessor {
    processEvent: (message: Message) => Promise<void>;
}

// main lambda handler
export async function lambdaHandler(event: SQSEvent, _context: any): Promise<void> {
    console.debug('Processing event', event);
    await Promise.all(event.Records?.map((x) => processRecord(x)));
}

async function processRecord(record: SQSRecord): Promise<void> {
    const message = JSON.parse(record.body);
    const source = message.source;

    const securityHubEventProcessor = SecurityHubEventProcessor.getInstance();
    const configEventProcessor = ConfigEventProcessor.getInstance();

    await securityHubEventProcessor.setup(
        process.env.EVIDENCE_STORE_API_SSM || '',
        process.env.API_SECRET_NAME || ''
    );
    await configEventProcessor.setup(
        process.env.EVIDENCE_STORE_API_SSM || '',
        process.env.API_SECRET_NAME || ''
    );

    switch (source) {
        case 'aws.securityhub':
            console.debug('Processing security hub event', message);
            await securityHubEventProcessor.processEvent(message);
            break;
        case 'aws.config':
            console.debug('Processing aws config event', message);
            await configEventProcessor.processEvent(message);
            break;
    }
}
