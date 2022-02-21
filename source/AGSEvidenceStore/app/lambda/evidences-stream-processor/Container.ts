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

import * as aws from 'aws-sdk';
import * as es from '@elastic/elasticsearch';
import { LoggerFactory, StaticLoggerFactory } from '@apjsb-serverless-lib/logger';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import { EvidenceContentRepository } from 'src/data/EvidenceContentRepository';
import { EvidenceElasticSearchDomain } from 'src/data/EvidenceElasticSearchDomain';
import { KinesisStreamHandler } from './handlers/KinesisStreamHandler';
import { StreamHelper } from './StreamHelper';
import { container } from 'tsyringe';
import { createAWSConnection } from '@acuris/aws-es-connection';
import { CloudWatchClient } from './CloudWatchClient';
import { QldbHelper } from 'src/data/QldbHelper';
import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';
import AWSXRay from 'aws-xray-sdk';

export function setupContainer(): void {
    if (!process.env.AWS_SAM_LOCAL) {
        // Capture all downstream AWS requests
        AWSXRay.captureAWS(aws);

        // Capture all outgoing https requests
        AWSXRay.captureHTTPsGlobal(https, true);
    }

    // configuration
    const appConfiguration = new AppConfiguration('EvidenceStreamProcessor');
    container.register<AppConfiguration>('AppConfiguration', {
        useValue: appConfiguration,
    });

    container.register<LoggerFactory>('LoggerFactory', {
        useValue: new StaticLoggerFactory(),
    });

    // handlers
    container.register<KinesisStreamHandler>('KinesisStreamHandler', {
        useClass: KinesisStreamHandler,
    });

    container.register<StreamHelper>('StreamHelper', { useClass: StreamHelper });

    const configuration: aws.ConfigurationOptions = {
        customUserAgent: appConfiguration.customUserAgent,
    };

    container.register<EvidenceElasticSearchDomain>('EvidenceElasticSearchDomain', {
        useValue: new EvidenceElasticSearchDomain(
            new es.Client({
                node: process.env['ELASTICSEARCH_DOMAIN']
                    ? process.env['ELASTICSEARCH_DOMAIN']
                    : 'http://localhost',
                ...createAWSConnection(aws.config.credentials as aws.Credentials),
            })
        ),
    });

    container.register<EvidenceContentRepository>('EvidenceContentRepository', {
        useClass: EvidenceContentRepository,
    });

    container.register<aws.S3>('S3', {
        useValue: new aws.S3(configuration),
    });

    container.register<CloudWatchClient>('CloudWatchClient', {
        useValue: new CloudWatchClient(new aws.CloudWatch(configuration)),
    });

    const httpOptions: aws.HTTPOptions | undefined = appConfiguration.proxyUri
        ? { agent: new HttpsProxyAgent(appConfiguration.proxyUri) }
        : undefined;

    container.register<aws.QLDB>('QLDB', {
        useValue: new aws.QLDB({ ...configuration, httpOptions }),
    });

    container.register<QldbHelper>('QldbHelper', { useClass: QldbHelper });
}
