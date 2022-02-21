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
import { SecurityHubFinding } from './SecurityHubEvent';

export function filterFindingsWithAcceptedSuffixes(
    message: any,
    findingSourceProductArns: string[]
): SecurityHubFinding[] {
    return message?.detail?.findings
        ? message?.detail?.findings.filter((res: SecurityHubFinding) => {
              return doesFindingHaveMatchingSources(res, findingSourceProductArns);
          })
        : [];
}

export function getAgsRelatedFindings(
    findings: SecurityHubFinding[]
): SecurityHubFinding[] {
    return findings.filter((x) =>
        x.Resources.some(
            (r) => r.Tags && Object.keys(r.Tags).some((t) => t.startsWith('AGS'))
        )
    );
}

function doesFindingHaveMatchingSources(
    finding: SecurityHubFinding,
    productArnAcceptedSuffixes: string[]
): boolean {
    const matchResults = productArnAcceptedSuffixes.map(
        (servicePrefix) => finding.ProductArn?.match(servicePrefix) != null
    );
    return matchResults != null && matchResults.includes(true);
}
