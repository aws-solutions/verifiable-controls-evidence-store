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
import esb from 'elastic-builder';

export function buildEvidenceSearchQuery(
    limit: number,
    startIndex: number,
    targetIds?: string[],
    providerId?: string,
    providerIds?: string[],
    schemaId?: string,
    content?: string,
    fromTimestamp?: string,
    toTimestamp?: string
) {
    const builder = new esb.RequestBodySearch();

    const innerQueries = [];
    if (targetIds && targetIds.length > 0) {
        // match primary targetId
        const targetIdQuery = esb.boolQuery();
        targetIdQuery.must(
            esb
                .boolQuery()
                .should(targetIds.map((x) => esb.termQuery('targetId.keyword', x)))
                .should(esb.termsQuery('additionalTargetIds.keyword', targetIds))
        );

        innerQueries.push(targetIdQuery);
    }

    if (providerIds && providerIds.length > 0) {
        // match providerId
        const providerIdQuery = esb.boolQuery();
        providerIdQuery.must(
            esb
                .boolQuery()
                .should(
                    providerIds
                        .map((x) => esb.termQuery('providerId.keyword', x))
                        .concat(
                            providerIds.map((x) =>
                                esb.termQuery('content.source.keyword', x)
                            )
                        )
                )
        );

        innerQueries.push(providerIdQuery);
    }

    if (fromTimestamp) {
        innerQueries.push(
            esb.rangeQuery('createdTimestamp').from(fromTimestamp).includeLower(true)
        );
    }

    if (toTimestamp) {
        innerQueries.push(
            esb.rangeQuery('createdTimestamp').to(toTimestamp).includeUpper(true)
        );
    }

    if (providerId) {
        innerQueries.push(esb.termQuery('providerId.keyword', providerId));
    }

    if (schemaId) {
        innerQueries.push(esb.termQuery('schemaId.keyword', schemaId));
    }

    if (content) {
        innerQueries.push(esb.wildcardQuery('contentString', `*${content}*`));
    }

    const query =
        innerQueries.length > 0
            ? builder.query(esb.boolQuery().filter(esb.boolQuery().must(innerQueries)))
            : builder.query(esb.matchAllQuery());

    if (limit) {
        query.size(limit);
    }

    if (startIndex) {
        query.from(startIndex);
    }

    query.sort(esb.sort('createdTimestamp', 'desc'));

    return query.toJSON();
}
