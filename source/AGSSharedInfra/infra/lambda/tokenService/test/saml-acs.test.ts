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
import { APIGatewayProxyEvent } from 'aws-lambda';
describe('saml acs lambda test', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules(); // Most important - it clears the cache
        process.env = { ...OLD_ENV }; // Make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // Restore old environment
    });

    test('Test Positive', async () => {
        process.env.IDENTITY_PROVIDERS = '{ "testKey": "testValue" }';
        process.env.AGS_REGION = 'us-east-1';
        process.env.AGS_EXTERNAL_USER_ROLE_ARN = 'dummy-user-role-arn';

        const expected = {
            body: `
            <html>
            <head><title>AWS Governance Suite Login</title></head>
            <body>
            <script type="text/javascript">
            var loginInfo = {
                region: "us-east-1",
                identityProviders: { "testKey": "testValue" },
                roleArn: "dummy-user-role-arn",
                samlToken: "dummy text"
            };
            var sessionStorage = window.sessionStorage;
            sessionStorage.setItem("loginInfo", JSON.stringify(loginInfo));
            document.location.href="/"
            </script>
            </body>
            </html>
        `,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/html',
            },
            statusCode: 200,
        };

        const { handler } = await import('../src/saml-acs');
        await expect(
            handler({ body: 'dummy text' } as APIGatewayProxyEvent, {})
        ).resolves.toStrictEqual(expected);
    });

    test('Test Negative without body', async () => {
        process.env.AGS_REGION = 'us-east-1';
        process.env.AGS_EXTERNAL_USER_ROLE_ARN = 'dummy-user-role-arn';

        const expected = {
            body: `{"error":"Invalid SAML2.0 Response"}`,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            statusCode: 400,
        };

        const { handler } = await import('../src/saml-acs');
        await expect(handler({} as APIGatewayProxyEvent, {})).resolves.toStrictEqual(
            expected
        );
    });
});
