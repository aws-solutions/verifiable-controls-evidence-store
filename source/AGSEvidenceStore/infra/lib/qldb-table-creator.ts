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

import * as cdk from 'aws-cdk-lib';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

import { Construct } from 'constructs';
import { v4 as uuid } from 'uuid';

export interface QldbTableCreatorCustomResourceProps {
    ledgerName: string;
    tableName: string;
    indexField: string;
    ledgerArn: string;
    canaryAuthorityApiKey: string;
    authorityTable: ddb.Table;
    schemaTable: ddb.Table;
}

export class QldbTableCreatorCustomResource extends Construct {
    constructor(
        scope: Construct,
        id: string,
        props: QldbTableCreatorCustomResourceProps
    ) {
        super(scope, id);

        const stack = cdk.Stack.of(this);
        const provider = new QldbTableCreator(
            stack,
            `qldb${props.tableName}-table-creator`,
            props.ledgerArn,
            props.authorityTable,
            props.schemaTable
        );
        new cdk.CustomResource(this, 'qldb-custom-resource', {
            resourceType: 'Custom::QldbTableCreatorCustomResource',
            properties: {
                LedgerName: props.ledgerName,
                TableName: props.tableName,
                IndexField: props.indexField,
                CanaryAuthorityApiKey: props.canaryAuthorityApiKey,
                AuthorityTableName: props.authorityTable.tableName,
                SchemaTableName: props.schemaTable.tableName,
                ExecutionId: uuid().toString(),
            },
            serviceToken: provider.provider.serviceToken,
        });
    }
}

class QldbTableCreator extends Construct {
    public readonly provider: cr.Provider;

    constructor(
        scope: Construct,
        id: string,
        qldbLedgerArn: string,
        authorityTable: ddb.Table,
        schemaTable: ddb.Table
    ) {
        super(scope, id);

        const fn = new lambda.SingletonFunction(this, 'qldb-table-creator-fn', {
            uuid: 'qldb-table-creator-provider',
            handler: 'index.onEvent',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset(
                path.join(__dirname, './qldb-table-creator/dist')
            ),
            timeout: cdk.Duration.minutes(1),
            tracing: lambda.Tracing.ACTIVE,
        });

        fn.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    'qldb:List*',
                    'qldb:Describe*',
                    'qldb:Get*',
                    'qldb:SendCommand',
                ],
                effect: iam.Effect.ALLOW,
                resources: [qldbLedgerArn],
            })
        );

        authorityTable.grantReadWriteData(fn);
        schemaTable.grantReadWriteData(fn);

        this.provider = new cr.Provider(this, 'provider', {
            onEventHandler: fn,
            logRetention: logs.RetentionDays.ONE_MONTH,
        });
    }
}
