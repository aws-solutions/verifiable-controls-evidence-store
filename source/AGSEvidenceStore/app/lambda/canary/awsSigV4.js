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
const crypto = require('crypto');

const AWS_SHA_256 = 'AWS4-HMAC-SHA256';
const AWS4_REQUEST = 'aws4_request';
const AWS4 = 'AWS4';
const X_AMZ_DATE = 'x-amz-date';
const X_AMZ_SECURITY_TOKEN = 'x-amz-security-token';
const HOST = 'host';
const AUTHORIZATION = 'Authorization';

function hmac(key, string, encoding) {
    return crypto.createHmac('sha256', key).update(string, 'utf8').digest(encoding);
}

function hash(string, encoding) {
    return crypto.createHash('sha256').update(string, 'utf8').digest(encoding);
}

function calculateSignature(key, stringToSign) {
    return hmac(key, stringToSign, 'hex');
}

function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
}

function buildCanonicalRequest(method, path, queryParams, headers, payload) {
    return (
        method +
        '\n' +
        buildCanonicalUri(path) +
        '\n' +
        buildCanonicalQueryString(queryParams) +
        '\n' +
        buildCanonicalHeaders(headers) +
        '\n' +
        buildCanonicalSignedHeaders(headers) +
        '\n' +
        hash(payload, 'hex')
    );
}

function buildCanonicalUri(uri) {
    return encodeURI(uri);
}

function buildCanonicalQueryString(queryParams) {
    if (Object.keys(queryParams).length < 1) {
        return '';
    }

    let sortedQueryParams = [];
    for (let property in queryParams) {
        if (Object.prototype.hasOwnProperty.call(queryParams, property)) {
            sortedQueryParams.push(property);
        }
    }
    sortedQueryParams.sort();

    let canonicalQueryString = '';
    for (let i = 0; i < sortedQueryParams.length; i++) {
        canonicalQueryString +=
            sortedQueryParams[i] +
            '=' +
            fixedEncodeURIComponent(queryParams[sortedQueryParams[i]]) +
            '&';
    }
    return canonicalQueryString.substr(0, canonicalQueryString.length - 1);
}

function buildCanonicalHeaders(headers) {
    let canonicalHeaders = '';
    let sortedKeys = [];
    for (let property in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, property)) {
            sortedKeys.push(property);
        }
    }
    sortedKeys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    for (let i = 0; i < sortedKeys.length; i++) {
        canonicalHeaders +=
            sortedKeys[i].toLowerCase() + ':' + headers[sortedKeys[i]] + '\n';
    }
    return canonicalHeaders;
}

function hashCanonicalRequest(request) {
    return hash(request, 'hex');
}

function buildCanonicalSignedHeaders(headers) {
    let sortedKeys = [];
    for (let property in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, property)) {
            sortedKeys.push(property.toLowerCase());
        }
    }
    sortedKeys.sort();

    return sortedKeys.join(';');
}

function buildCredentialScope(datetime, region, service) {
    return datetime.substr(0, 8) + '/' + region + '/' + service + '/' + AWS4_REQUEST;
}

function calculateSigningKey(secretKey, datetime, region, service) {
    return hmac(
        hmac(hmac(hmac(AWS4 + secretKey, datetime.substr(0, 8)), region), service),
        AWS4_REQUEST
    );
}

function buildAuthorizationHeader(accessKey, credentialScope, headers, signature) {
    return (
        AWS_SHA_256 +
        ' Credential=' +
        accessKey +
        '/' +
        credentialScope +
        ', SignedHeaders=' +
        buildCanonicalSignedHeaders(headers) +
        ', Signature=' +
        signature
    );
}

function buildStringToSign(datetime, credentialScope, hashedCanonicalRequest) {
    return (
        AWS_SHA_256 +
        '\n' +
        datetime +
        '\n' +
        credentialScope +
        '\n' +
        hashedCanonicalRequest
    );
}

module.exports.signRequest = (opts, config) => {
    const region = config.region;
    const serviceName = config.service;
    const accessKey = config.accessKey;
    const secretKey = config.secretKey;
    const sessionToken = config.sessionToken;

    let datetime = new Date(new Date().getTime())
        .toISOString()
        .replace(/\.\d{3}Z$/, 'Z')
        .replace(/[:-]|\.\d{3}/g, '');

    const headers = opts.headers;
    headers[X_AMZ_DATE] = datetime;
    headers[HOST] = opts.hostname;

    let canonicalRequest = buildCanonicalRequest(
        opts.method,
        opts.path,
        opts.queryParams || {},
        headers,
        opts.body || ''
    );

    let hashedCanonicalRequest = hashCanonicalRequest(canonicalRequest);
    let credentialScope = buildCredentialScope(datetime, region, serviceName);

    let stringToSign = buildStringToSign(
        datetime,
        credentialScope,
        hashedCanonicalRequest
    );

    let signingKey = calculateSigningKey(secretKey, datetime, region, serviceName);

    let signature = calculateSignature(signingKey, stringToSign);

    headers[AUTHORIZATION] = buildAuthorizationHeader(
        accessKey,
        credentialScope,
        headers,
        signature
    );

    if (sessionToken !== undefined && sessionToken !== '') {
        headers[X_AMZ_SECURITY_TOKEN] = sessionToken;
    }

    // append query string at the end of the path
    let queryString = buildCanonicalQueryString(opts.queryParams || {});
    if (queryString !== '') {
        opts.path += `?${queryString}`;
    }
};
