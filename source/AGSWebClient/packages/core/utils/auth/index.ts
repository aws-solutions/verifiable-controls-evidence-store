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
import * as queryString from 'query-string';
import * as saml from 'saml20';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import get from 'lodash.get';
import {
    isDevEnv,
    devCredentials,
    devRegion,
    devUserName,
    devUserGroups,
} from '../../config/devConst';
import { AuthSettings } from '../../types';

interface IdentityProviderInfo {
    type: 'COGNITO' | 'SAML';
    url?: string;
    audience?: string;
    arn?: string;
    loginUrl: string;
    displayNameAttributeName: string;
    userGroupAttributeName: string;
}

interface LoginInfo {
    region: string;
    roleArn: string;
    identityProviders: IdentityProviderInfo[];
}

interface SAMLLoginInfo extends LoginInfo {
    samlToken: string;
}

interface CognitoLoginInfo extends LoginInfo {
    code: string;
}

/* istanbul ignore next */
async function doLogin(auth: AuthSettings) {
    const loginInfoStr = window.sessionStorage.getItem('loginInfo') ?? '{}';
    const loginInfo = JSON.parse(loginInfoStr) as LoginInfo;
    if (loginInfo.identityProviders && loginInfo.identityProviders[0].type === 'SAML') {
        return doSAMLLogin();
    } else if (
        loginInfo.identityProviders &&
        loginInfo.identityProviders[0].type === 'COGNITO'
    ) {
        return doCognitoLogin(auth);
    } else {
        const errorMsg = 'No valid Identity Provider provided.';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}

/* istanbul ignore next */
async function doCognitoLogin(auth: AuthSettings) {
    const loginInfoStr = window.sessionStorage.getItem('loginInfo') ?? '{}';
    const loginInfo = JSON.parse(loginInfoStr) as CognitoLoginInfo;

    // if there is no SAML token, return error
    if (!loginInfo.code) {
        throw new Error('No valid Cognito Code in Session.');
    }
    // get the auth code
    const authCode = loginInfo.code;
    // retrieve JWT tokens from token endpoint
    const form: Record<string, string> = {
        grant_type: 'authorization_code',
        client_id: auth.cognitoClientId ?? '',
        redirect_uri: auth.cognitoRedirectUri ?? '',
        code: authCode,
    };

    const formBody = Object.keys(form)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(form[key]))
        .join('&');

    const tokenEndpointUrl = `https://${auth.cognitoDomain}/oauth2/token`;
    const tokens = await (
        await fetch(tokenEndpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body: formBody,
        })
    ).json();

    console.debug(tokens);

    const cognitoIdentity = new AWS.CognitoIdentity({
        apiVersion: '2014-06-30',
        region: loginInfo.region,
    });
    const identityId =
        (
            await cognitoIdentity
                .getId({
                    IdentityPoolId: auth.cognitoIdentityPoolId ?? '',
                    AccountId: auth.accountId,
                    Logins: {
                        [`cognito-idp.${loginInfo.region}.amazonaws.com/${auth.cognitoUserPoolId}`]:
                            tokens.id_token,
                    },
                })
                .promise()
        ).IdentityId ?? '';

    const { Credentials } = await cognitoIdentity
        .getCredentialsForIdentity({
            IdentityId: identityId,
            Logins: {
                [`cognito-idp.${loginInfo.region}.amazonaws.com/${auth.cognitoUserPoolId}`]:
                    tokens.id_token,
            },
        })
        .promise();

    console.log('Succeed to get credentials from Cognito Identity Pool');

    // decode the id token to get user name and groups
    const decodedToken = jwtDecode<JwtPayload>(tokens.id_token) as {
        name: string;
        'custom:AGSRoles': string;
    };
    const displayName = decodedToken.name;
    const userGroups = (decodedToken['custom:AGSRoles'] ?? '').split('/');
    console.log(
        `User login successfully. Display Name: ${displayName}, User Groups: ${userGroups.join(
            ','
        )}`
    );
    const credentials = {
        region: loginInfo.region,
        roleArn: loginInfo.roleArn,
        accessKeyId: Credentials!.AccessKeyId,
        secretAccessKey: Credentials!.SecretKey,
        sessionToken: Credentials!.SessionToken,
        displayName,
        userGroups,
        sessionExpiryTime: Credentials!.Expiration!.toISOString(),
    };

    console.debug(credentials);
    return credentials;
}

/* istanbul ignore next */
function doSAMLLogin() {
    return new Promise((resolve, reject) => {
        const loginInfoStr = window.sessionStorage.getItem('loginInfo') ?? '{}';
        const loginInfo = JSON.parse(loginInfoStr) as SAMLLoginInfo;

        // if there is no SAML token, return error
        if (!loginInfo.samlToken) {
            reject('No valid SAML token in Session.');
        }

        // proceed to login
        const tokenParsed = queryString.parse(loginInfo.samlToken);
        const samlResponse = tokenParsed.SAMLResponse as string;
        const tokenDecoded = Buffer.from(samlResponse, 'base64').toString();
        console.debug('SAML Response: ' + tokenDecoded);

        const samlProviders = loginInfo.identityProviders.filter(
            ({ type }) => type === 'SAML'
        );

        const samlTokenExpiryTime = getSamlTokenExpiryDate(tokenDecoded);
        if (samlTokenExpiryTime < new Date()) {
            reject('SAML Token has expired.');
        }

        if (samlProviders.length > 0) {
            // SAML Provider
            // TODO: temporarily choose the first and only one. If there are multiple SAML IdP,
            // need to decode the token and find the correct one.
            const samlProvider = samlProviders[0];
            // SAML credentials
            const samlCredentials = new AWS.SAMLCredentials({
                PrincipalArn: samlProvider.arn ?? '',
                RoleArn: loginInfo.roleArn,
                SAMLAssertion: samlResponse,
            });

            const displayNameAttributeName =
                samlProvider.displayNameAttributeName ||
                'https://aws.amazon.com/SAML/Attributes/PrincipalTag:DisplayName';

            const userGroupAttributeName =
                samlProvider.userGroupAttributeName ||
                'https://aws.amazon.com/SAML/Attributes/PrincipalTag:AGSRoles';

            // get temporarily credentials
            samlCredentials.refresh((err) => {
                // Credentials will be available when this function is called.
                if (err) {
                    console.log(
                        'Failed to get STS credentials. Error: ' + JSON.stringify(err)
                    );
                    console.debug(err);
                    reject(err);
                } else {
                    console.log('Succeed to get STS credentials');

                    saml.parse(tokenDecoded, (err, profile) => {
                        const displayName =
                            profile.claims[displayNameAttributeName] ?? '';
                        const userGroupsStr =
                            profile.claims[userGroupAttributeName] ?? '';

                        const userGroups = userGroupsStr.split('/');
                        const credentials = {
                            region: loginInfo.region,
                            roleArn: loginInfo.roleArn,
                            accessKeyId: samlCredentials.accessKeyId,
                            secretAccessKey: samlCredentials.secretAccessKey,
                            sessionToken: samlCredentials.sessionToken,
                            displayName,
                            userGroups,
                            sessionExpiryTime: samlCredentials.expireTime.toISOString(),
                        };
                        console.debug(credentials);
                        resolve(credentials);
                    });
                }
            });
        } else {
            const errorMsg = 'No valid SAML Identity Provider in Session.';
            console.error(errorMsg);
            reject(errorMsg);
        }
    });
}

/* istanbul ignore next */
function getSamlTokenExpiryDate(samlToken: string): Date {
    const dteNotOnOrAfter = get(samlToken, 'Conditions.@.NotOnOrAfter');
    const notOnOrAfter = new Date(dteNotOnOrAfter);
    return notOnOrAfter;
}

/* istanbul ignore next */
async function login(auth: AuthSettings) {
    const localStorage = window.localStorage;

    // always remove credentials in dev server
    if (isDevEnv) {
        console.log('Purge credentails from local storage in Dev Env');
        localStorage.removeItem('awsCredentials');
    }

    console.log('Checking credentials in local storage.');
    let hasValidLocalCredentials = false;
    const currentCredentials = localStorage.getItem('awsCredentials');
    if (currentCredentials) {
        try {
            const localCredentials = JSON.parse(currentCredentials);
            if (new Date(localCredentials.sessionExpiryTime) > new Date()) {
                hasValidLocalCredentials = true;
            }
        } catch (e) {
            console.log('local credentials exists but invalid.');
            console.debug(currentCredentials);
            window.localStorage.removeItem('awsCredentials');
        }
    }

    if (!hasValidLocalCredentials) {
        console.log(
            'No valid credential found in local storage. Rebuild credential from authentication response from IdP.'
        );
        window.localStorage.removeItem('awsCredentials');

        try {
            let newCredentials;
            // use local environment variable AWS credentials for dev server
            if (isDevEnv) {
                newCredentials = {
                    region: devRegion,
                    accessKeyId: devCredentials.accessKeyId,
                    secretAccessKey: devCredentials.secretAccessKey,
                    sessionToken: devCredentials.sessionToken,
                    displayName: devUserName,
                    userGroups: devUserGroups,
                    sessionExpiryTime: new Date(Date.now() + 3600 * 1000).toISOString(),
                };
            } else {
                newCredentials = await doLogin(auth);
            }
            console.log('Credentails rebuilt successfully. Saving to local storage');
            console.debug(newCredentials);
            localStorage.setItem('awsCredentials', JSON.stringify(newCredentials));
        } catch (e) {
            console.log('Failed to rebuild credentails. Error: ' + JSON.stringify(e));
            console.error(e);
        }
    }
}

function clearSecurityToken() {
    window.localStorage.removeItem('awsCredentials');
}

function logout() {
    clearSecurityToken();
    window.sessionStorage.removeItem('loginInfo');
}

function getUserCredentials() {
    const userCredJSON = window.localStorage.getItem('awsCredentials');
    return userCredJSON ? JSON.parse(userCredJSON) : null;
}

export { login, logout, clearSecurityToken, getUserCredentials };
