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
import * as cw from 'aws-cdk-lib/aws-cloudwatch';

export class EvidenceStoreDatabaseDashboard {
    constructor(
        private ledgerName: string,
        private esDomain: string,
        private accountNumber: string
    ) {}

    esGreen = this.esMetric('green', 'ClusterStatus.green', cw.Statistic.MAXIMUM);

    esYellow = this.esMetric('green', 'ClusterStatus.yellow', cw.Statistic.MAXIMUM);

    public widgets: cw.IWidget[] = [
        this.databaseWidget(`${this.ledgerName} Ledger Latency`, [
            this.qldbMetric(
                'StartSessionRequest',
                'CommandLatency',
                cw.Stats.AVERAGE,
                cw.Unit.MILLISECONDS,
                { CommandType: 'StartSessionRequest' }
            ),
            this.qldbMetric(
                'StartTransactionRequest',
                'CommandLatency',
                cw.Stats.AVERAGE,
                cw.Unit.MILLISECONDS,
                { CommandType: 'StartTransactionRequest' }
            ),
            this.qldbMetric(
                'ExecuteStatementRequest',
                'CommandLatency',
                cw.Stats.AVERAGE,
                cw.Unit.MILLISECONDS,
                { CommandType: 'ExecuteStatementRequest' }
            ),
            this.qldbMetric(
                'CommitTransactionRequest',
                'CommandLatency',
                cw.Stats.AVERAGE,
                cw.Unit.MILLISECONDS,
                { CommandType: 'CommitTransactionRequest' }
            ),
        ]),
        this.createGraphWidget({
            title: 'ElasticSearch Cluster Status',
            left: [
                new cw.MathExpression({
                    expression: 'esGreen / 3',
                    label: 'ClusterStatus.green',
                    usingMetrics: { esGreen: this.esGreen },
                    color: '#093',
                }),
                new cw.MathExpression({
                    expression: 'esYellow*2/3',
                    label: 'ClusterStatus.yellow',
                    usingMetrics: { esYellow: this.esYellow },
                    color: '#e07700',
                }),
                new cw.Metric({
                    label: 'ClusterStatus.red',
                    metricName: 'ClusterStatus.red',
                    namespace: 'AWS/ES',
                    color: '#C00',
                    statistic: cw.Stats.MAXIMUM,
                    dimensionsMap: {
                        DomainName: this.esDomain,
                        ClientId: this.accountNumber,
                    },
                }),
            ],
            leftYAxis: { min: 0, max: 1, showUnits: false },
        }),
        this.databaseWidget('ElasticSearch Response Count', [
            this.esMetric('2xx', '2xx', cw.Stats.SUM, cw.Unit.COUNT),
            this.esMetric('3xx', '3xx', cw.Stats.SUM, cw.Unit.COUNT),
            this.esMetric('4xx', '4xx', cw.Stats.SUM, cw.Unit.COUNT),
            this.esMetric('5xx', '5xx', cw.Stats.SUM, cw.Unit.COUNT),
        ]),
        this.databaseWidget('Data Replication Delay', [
            this.createGraphMetric({
                metricName: 'QLDBReplicationDelay',
                namespace: 'AGS/EvidenceStore',
                unit: cw.Unit.MILLISECONDS,
                statistic: cw.Stats.AVERAGE,
            }),
        ]),
        this.databaseWidget('Indexed evidences', [
            this.esMetric(
                'Evidences',
                'SearchableDocuments',
                cw.Stats.AVERAGE,
                cw.Unit.COUNT
            ),
        ]),
    ];

    private databaseWidget(title: string, metrics: cw.IMetric[]): cw.IWidget {
        return this.createGraphWidget({ title, left: metrics });
    }

    private esMetric(
        label: string,
        metricName: string,
        statistic: string,
        unit?: cw.Unit
    ): cw.IMetric {
        return this.createGraphMetric({
            label,
            metricName,
            namespace: 'AWS/ES',
            statistic,
            unit,
            dimensionsMap: { DomainName: this.esDomain, ClientId: this.accountNumber },
        });
    }

    private qldbMetric(
        label: string,
        metricName: string,
        statistic: string,
        unit?: cw.Unit,
        dimensions?: Record<string, any>
    ) {
        return this.createGraphMetric({
            label,
            metricName,
            statistic,
            unit,
            namespace: 'AWS/QLDB',
            dimensionsMap: { ...dimensions, LedgerName: this.ledgerName },
        });
    }

    private createGraphWidget(props: cw.GraphWidgetProps): cw.GraphWidget {
        return new cw.GraphWidget({ height: 6, width: 6, liveData: true, ...props });
    }

    private createGraphMetric(props: cw.MetricProps): cw.IMetric {
        return new cw.Metric(props);
    }
}
