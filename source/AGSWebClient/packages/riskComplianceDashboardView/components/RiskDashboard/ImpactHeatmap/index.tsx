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
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Box from 'aws-northstar/layouts/Box';
import Grid from 'aws-northstar/layouts/Grid';
import Heatmap, { HeatmapDataType } from '@ags/webclient-core/components/Heatmap';
import { ROUTE_RISKS_V2_VIEW } from '@ags/webclient-risks-core/config/routes';
import RiskMitigationStatus from '../MitigationStatus';

export interface ImpactHeatmapProps {
    data: HeatmapDataType[];
    impactType: string;
    entityType: string;
    entityId: string;
}

const rows = ['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];
const columns = ['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];

const DEFAULT_TITLE =
    'Click on the cell for breakdown on different severity-likelihood levels';

const ImpactHeatmap: FunctionComponent<ImpactHeatmapProps> = ({
    data,
    entityType,
    entityId,
    impactType,
}) => {
    const history = useHistory();
    const [enableReset, setEnableReset] = useState(false);
    const [showRiskMitigationBreakdown, setShowRiskMitigationBreakdown] = useState(true);
    const [riskMitigationBreakdownSubtitle, setRiskMitigationBreakdownSubtitle] =
        useState<string>();
    const handleDblCick = useCallback(
        (data: HeatmapDataType) => {
            history.push(
                `${ROUTE_RISKS_V2_VIEW}?entityType=${entityType}&entityId=${entityId}&impactType=${impactType}&severity=${data.row}&likelihood=${data.column}`
            );
        },
        [history, entityId, entityType, impactType]
    );

    useEffect(() => {
        setRiskMitigationBreakdownSubtitle(DEFAULT_TITLE);
    }, []);

    const handleReset = useCallback(() => {
        setEnableReset(false);
        setShowRiskMitigationBreakdown(false);
        setRiskMitigationBreakdownSubtitle(DEFAULT_TITLE);
        setTimeout(() => {
            setShowRiskMitigationBreakdown(true);
        }, 1000);
    }, []);

    const handleCick = useCallback(
        (data: HeatmapDataType) => {
            setEnableReset(true);
            setShowRiskMitigationBreakdown(false);
            setRiskMitigationBreakdownSubtitle(
                `Severity (${data.row}) - Likelihood (${data.column})`
            );
            setTimeout(() => {
                setShowRiskMitigationBreakdown(true);
            }, 1000);
        },
        [setShowRiskMitigationBreakdown, setRiskMitigationBreakdownSubtitle]
    );

    return (
        <Box width="100%">
            <Grid container>
                <Grid item sm={7}>
                    <Box
                        width="100%"
                        height={400}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Heatmap
                            rows={rows}
                            columns={columns}
                            data={data}
                            minValue={0}
                            maxValue={10}
                            xLabel="Severity"
                            yLabel="Likelihood"
                            controlId={`Impact_${impactType}`}
                            onDblClick={handleDblCick}
                            onClick={handleCick}
                            width={700}
                            height={300}
                        />
                    </Box>
                </Grid>
                <Grid item sm={5}>
                    {showRiskMitigationBreakdown && (
                        <RiskMitigationStatus
                            title="Risk Mitigation Breakdown by Impact Type"
                            subtitle={riskMitigationBreakdownSubtitle}
                            onResetClick={(enableReset && handleReset) || undefined}
                        />
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImpactHeatmap;
