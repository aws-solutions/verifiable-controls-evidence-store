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

import 'reflect-metadata';

import { Context, KinesisStreamEvent } from 'aws-lambda';

import { KinesisStreamHandler } from 'evidences-stream-processor/handlers/KinesisStreamHandler';
import { handler } from 'evidences-stream-processor';

// This includes all tests for getByIdHandler()
describe('Evidence stream processor lambda tests', () => {
    test('request is routed to KinesisStreamHandler', async () => {
        // arrange
        KinesisStreamHandler.prototype.handle = jest.fn().mockResolvedValueOnce({});
        expect.assertions(1);

        // act
        await handler({} as KinesisStreamEvent, {} as Context, () => ({}));

        // assert
        expect(KinesisStreamHandler.prototype.handle).toHaveBeenCalled();
    });
});
