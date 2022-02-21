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
import * as rgTag from '@aws-sdk/client-resource-groups-tagging-api';
import { baseSdkClientConfig, createXRayEnabledClient } from '../common/SdkClient';
import { SecurityHubFinding } from '../SecurityHubEvent';
import { assumeRole } from './STSClient';

// this role name should match that defined in deployment-prerequisites/estate-account-evidence-collection-setup.yaml
// in order to allow the SHEC lambda to assume a role to retrieve cross-account tags on resources
const ASSUME_ROLE_NAME = process.env.ASSUME_ROLE_NAME;

export async function getResourcesTags(
    finding: SecurityHubFinding
): Promise<SecurityHubFinding> {
    // tags are optional field in finding, some sources include them, some don't. We only fetch them if they aren't in the finding

    const resourcesWithNoTags = finding.Resources.filter((x) => x.Tags === undefined);
    if (resourcesWithNoTags.length === 0) {
        // all resources have tags, we do nothing
        console.debug('All finding resources have tags');
        return finding;
    }

    console.debug(
        `Resources with ids [${finding.Resources.filter((x) => x.Tags !== undefined)
            .map((x) => x.Id)
            .join(', ')}] have tags`
    );

    console.debug(
        `Resources with ids [${resourcesWithNoTags
            .map((x) => x.Id)
            .join(', ')}] have no tags, getting them now`
    );

    try {
        // now we construct a list of resources that have no tags
        const resourceArnList = resourcesWithNoTags.map((x) => x.Id);

        const resourceTagMappings = await getTags(
            resourceArnList,
            finding.AwsAccountId,
            finding.Region
        );

        if (resourceTagMappings.length == 0) {
            // no tags found, return the original finding
            return finding;
        }
        const enrichedFinding: SecurityHubFinding = { ...finding };

        enrichedFinding.Resources = finding.Resources.map((x) => {
            return {
                DataClassification: x.DataClassification,
                Details: x.Details,
                Id: x.Id,
                Partition: x.Partition,
                Region: x.Region,
                ResourceRole: x.ResourceRole,
                Type: x.Type,
                Tags: x.Tags ?? getTagsForResource(resourceTagMappings, x.Id),
            };
        });
        return enrichedFinding;
    } catch (error) {
        console.error(error);
        // returning the original finding as to not fail the entire batch
        // we'll need to push this finding to dlq in the future
        return finding;
    }
}

export async function getTags(
    resourceArns: string[],
    accountId: string,
    region?: string
): Promise<rgTag.ResourceTagMapping[]> {
    try {
        const credentials = await assumeRole(
            `arn:aws:iam::${accountId}:role/${ASSUME_ROLE_NAME}`,
            'SHECLambaSession'
        );
        const rgtClient = createXRayEnabledClient(
            new rgTag.ResourceGroupsTaggingAPIClient({
                ...baseSdkClientConfig,
                region,
                credentials,
            })
        );
        const result = await rgtClient.send(
            new rgTag.GetResourcesCommand({ ResourceARNList: resourceArns })
        );

        return result.ResourceTagMappingList ? result.ResourceTagMappingList : [];
    } catch (e) {
        return [];
    }
}

function getTagsForResource(
    list: rgTag.ResourceTagMapping[] | undefined,
    resourceArn: string
): Record<string, string> | undefined {
    const mapping = list?.filter((x) => x.ResourceARN === resourceArn);

    if (!mapping || mapping.length === 0) {
        return undefined;
    }

    const tags = mapping[0]?.Tags;

    if (!tags) {
        return undefined;
    }

    const returnValue: Record<string, string> = {};

    tags.forEach((t) => {
        returnValue[t.Key!] = t.Value!;
    });

    return returnValue;
}
