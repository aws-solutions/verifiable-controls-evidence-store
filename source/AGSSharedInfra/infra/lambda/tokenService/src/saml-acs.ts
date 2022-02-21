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
import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    APIGatewayEventDefaultAuthorizerContext,
} from 'aws-lambda';

const identityProvidersJSON = process.env.IDENTITY_PROVIDERS || '{}';
const agsRegion = process.env.AGS_REGION;
const agsExternalUserRoleArn = process.env.AGS_EXTERNAL_USER_ROLE_ARN;

export async function handler(
    event: APIGatewayProxyEvent, // eslint-disable-line @typescript-eslint/no-unused-vars
    context: APIGatewayEventDefaultAuthorizerContext // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<APIGatewayProxyResult> {
    if (event.body) {
        const token = event.body;
        const content = `
            <html>
            <head><title>AWS Governance Suite Login</title></head>
            <body>
            <script type="text/javascript">
            var loginInfo = {
                region: "${agsRegion}",
                identityProviders: ${identityProvidersJSON},
                roleArn: "${agsExternalUserRoleArn}",
                samlToken: "${token}"
            };
            var sessionStorage = window.sessionStorage;
            sessionStorage.setItem("loginInfo", JSON.stringify(loginInfo));
            document.location.href="/"
            </script>
            </body>
            </html>
        `;
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*',
            },
            body: content,
        };
    }
    return {
        statusCode: 400,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid SAML2.0 Response' }),
    };
}
