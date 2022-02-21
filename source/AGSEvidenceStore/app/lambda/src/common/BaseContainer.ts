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
import { container } from 'tsyringe';
import { LoggerFactory, StaticLoggerFactory } from '@apjsb-serverless-lib/logger';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';

import * as aws from 'aws-sdk';
import * as es from '@elastic/elasticsearch';
import { QldbDriver } from 'amazon-qldb-driver-nodejs';
import { createAWSConnection } from '@acuris/aws-es-connection';
import { HttpsProxyAgent } from 'https-proxy-agent';

// register the global system object in this file
const appConfiguration = new AppConfiguration('EvidenceStore');

// register global configure
container.register<AppConfiguration>('AppConfiguration', {
    useValue: appConfiguration,
});

// register logger
container.register<LoggerFactory>('LoggerFactory', { useClass: StaticLoggerFactory });

// sdk clients
const credentialProviderChain = new aws.CredentialProviderChain();
credentialProviderChain.providers.push(new aws.EnvironmentCredentials('AWS'));

const configuration: aws.ConfigurationOptions = {
    credentialProvider: credentialProviderChain,
    customUserAgent: appConfiguration.customUserAgent,
};

container.register<aws.DynamoDB.DocumentClient>('DocumentClient', {
    useValue: new aws.DynamoDB.DocumentClient(configuration),
});

container.register<aws.S3>('S3', {
    useValue: new aws.S3({ ...configuration, signatureVersion: 'v4' }),
});

container.register<QldbDriver>('QldbDriver', {
    useValue: new QldbDriver(appConfiguration.evidenceLedgerName, configuration),
});

container.register<es.Client>('ElasticSearchClient', {
    useValue: new es.Client({
        ...createAWSConnection(aws.config.credentials as aws.Credentials),
        node: appConfiguration.evidenceElasticSearchDomain,
    }),
});

container.register<es.Client>('DslClient', {
    useValue: new es.Client({
        ...createAWSConnection(aws.config.credentials as aws.Credentials),
        node: appConfiguration.evidenceElasticSearchNode,
    }),
});

container.register<aws.SSM>('SSM', { useValue: new aws.SSM(configuration) });

const httpOptions: aws.HTTPOptions | undefined = appConfiguration.proxyUri
    ? {
          agent: new HttpsProxyAgent(appConfiguration.proxyUri),
      }
    : undefined;

container.register<aws.APIGateway>('APIGateway', {
    useValue: new aws.APIGateway({
        ...configuration,
        httpOptions,
    }),
});

container.register<aws.QLDB>('QLDB', {
    useValue: new aws.QLDB({ ...configuration, httpOptions }),
});
