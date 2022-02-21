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
import { parseElasticSearchError } from 'src/data/ElasticSearchErrorParser';

describe('ElasticSearchErrorParser tests', () => {
    test('can parse elastic search error', () => {
        // arrange
        const error = {
            name: 'ResponseError',
            meta: {
                body: '{\n  "error": {\n    "reason": "Error occurred in Elasticsearch engine: no such index [evidences]",\n    "details": "org.elasticsearch.index.IndexNotFoundException: no such index [evidences]\\nFor more details, please send request for Json format to see the raw response from elasticsearch engine.",\n    "type": "IndexNotFoundException"\n  },\n  "status": 404\n}',
                statusCode: 400,
                headers: {
                    date: 'Thu, 25 Mar 2021 06:23:43 GMT',
                    'content-type': 'text/plain;charset=UTF-8',
                    'content-length': '361',
                    connection: 'keep-alive',
                    'access-control-allow-origin': '*',
                },
                meta: {
                    context: null,
                    request: {
                        params: {
                            method: 'POST',
                            path: '/_sql',
                            body: '{"query":"SELECT * FROM evidences a where a.inputHash = \'xFytXJVZ6G+wRGqFoqJ7VCnh3y5XiyIYObBHpKPT/gw=\'"}',
                            querystring: 'format=json',
                            headers: {
                                'user-agent':
                                    'elasticsearch-js/7.11.0 (linux 4.14.219-169.354.amzn2.x86_64-x64; Node.js v14.15.4)',
                                'x-elastic-client-meta':
                                    'es=7.11.0,js=14.15.4,t=7.11.0,hc=14.15.4',
                                'content-type': 'application/json',
                                'content-length': '107',
                            },
                            timeout: 30000,
                        },
                        options: {},
                        id: 1,
                    },
                    name: 'elasticsearch-js',
                    connection: {
                        url: 'https://vpc-agsatte-agsatt-y7anw2wpld2g-67pifobigvmb63raekk5u5wnbq.ap-southeast-2.es.amazonaws.com/_opendistro/',
                        id: 'https://vpc-agsatte-agsatt-y7anw2wpld2g-67pifobigvmb63raekk5u5wnbq.ap-southeast-2.es.amazonaws.com/_opendistro/',
                        headers: {},
                        deadCount: 0,
                        resurrectTimeout: 0,
                        _openRequests: 0,
                        status: 'alive',
                        roles: {
                            master: true,
                            data: true,
                            ingest: true,
                            ml: false,
                        },
                    },
                    attempts: 0,
                    aborted: false,
                },
            },
            stack: 'ResponseError: Response Error\n    at x (/var/task/app.js:2:225447)\n    at IncomingMessage.d (/var/task/app.js:2:224466)\n    at IncomingMessage.emit (events.js:327:22)\n    at IncomingMessage.EventEmitter.emit (domain.js:467:12)\n    at endReadableNT (internal/streams/readable.js:1327:12)\n    at processTicksAndRejections (internal/process/task_queues.js:80:21)',
        };

        // act
        const esError = parseElasticSearchError(error);

        // assert
        expect(esError).not.toBeUndefined();
        expect(esError?.type).toBe('IndexNotFoundException');
    });
});
