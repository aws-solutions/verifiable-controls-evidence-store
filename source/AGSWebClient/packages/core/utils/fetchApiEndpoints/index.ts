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
import * as AWS from 'aws-sdk';
import { UserCredential, ApiEndpoints } from '../../types';

const fetchApiEndpoints = async (
    userCredential: UserCredential
): Promise<ApiEndpoints> => {
    const credentials = new AWS.Credentials(
        userCredential.accessKeyId,
        userCredential.secretAccessKey,
        userCredential.sessionToken
    );
    const ssm = new AWS.SSM({
        region: userCredential.region,
        credentials,
    });

    const results = [];
    let nextToken: string | undefined = undefined;
    do {
        const params: AWS.SSM.GetParametersByPathRequest = {
            Path: '/ags/endpoints',
            Recursive: false,
            MaxResults: 10,
        };

        if (nextToken) {
            params.NextToken = nextToken;
        }

        const pageResult = await ssm.getParametersByPath(params).promise();

        if (pageResult && pageResult.Parameters) {
            results.push(...pageResult.Parameters);
        }

        nextToken = pageResult.NextToken;
    } while (nextToken);

    const serviceNameReg = /^\/ags\/endpoints\/(.+)$/;
    if (results && results.length > 0) {
        const apiEndpoints: ApiEndpoints = results.reduce((endpoints, param) => {
            const serviceName = (param.Name || '').match(serviceNameReg)?.[1];
            if (serviceName) {
                endpoints[serviceName] = param.Value ?? '';
            }
            return endpoints;
        }, {} as ApiEndpoints);
        return apiEndpoints;
    } else {
        console.log("Can't find ApiEndpoints from backend.");
        throw new Error("Can't find ApiEndpoints from backend.");
    }
};

export default fetchApiEndpoints;
