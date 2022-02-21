"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApjsbAwsHttpClient = exports.createHttpClient = void 0;
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
require("source-map-support/register");
const sha256_js_1 = require("@aws-crypto/sha256-js");
const node_http_handler_1 = require("@aws-sdk/node-http-handler");
const protocol_http_1 = require("@aws-sdk/protocol-http");
const signature_v4_1 = require("@aws-sdk/signature-v4");
const Deserilizer_1 = require("./deserilizer/Deserilizer");
const loglevel_1 = require("loglevel");
const nodeUrl = require("url");
const DefaultCredentialProvider_1 = require("./DefaultCredentialProvider");
/**
 * Creates an instance of an ApjsbAwsHttpClient
 * @param region The AWS region
 * @param compatiblityMode If set true, the basic NodeJS's https handler is used to submit the request and process the response. If set to false, the aws-sdk v3 NodeHttpHandler i sued to submit the request and process the response. @default false
 * @param credentialProvider The credential provider. @default aws.EnvironmentCredentials
 * @param httpsAgent The NodeJS's HttpsAgent @default: undefined
 */
function createHttpClient(region, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
compatibilityMode = false, credentialProvider = new DefaultCredentialProvider_1.DefaultCredentialProvider(), httpsAgent) {
    return new ApjsbAwsHttpClient(credentialProvider, region, httpsAgent);
}
exports.createHttpClient = createHttpClient;
const noPayloadRequestMethod = [
    'GET',
    'HEAD',
    'PATCH',
    'CONNECT',
    'OPTIONS',
    'TRACE',
];
const withPayloadRequestMethod = ['POST', 'PUT', 'DELETE'];
/**
 * A Http Handler that supports AWS V4 signature
 */
class ApjsbAwsHttpClient {
    /**
     * Initialises a new AWS NodeHttpHandler
     * @param credentialProvider the AWS credentials provider
     * @param region the AWS region
     * @param httpsAgent Optional - the httpsAgent to be used
     */
    constructor(credentialProvider, region, httpsAgent, customHandler) {
        var _a;
        this.credentialProvider = credentialProvider;
        this.region = region;
        this.httpsAgent = httpsAgent;
        this.customHandler = customHandler;
        this.httpClient = new node_http_handler_1.NodeHttpHandler({ httpsAgent });
        loglevel_1.default.setDefaultLevel((_a = loglevel_1.default.getLevel()) !== null && _a !== void 0 ? _a : 'info');
    }
    /**
     * Send get request to remote
     * @param uri The request's uri
     * @param service The underline service this request sends to, e.g ec2 | elb
     * @param queryParameters The query parameter in the form of key value pair,
     * @param headers the request's header collection
     */
    async get(uri, service, headers) {
        return await this.request('GET', uri, service, undefined, headers);
    }
    /**
     * Send post request to remote
     * @param uri The request's uri
     * @param service The underline service this request sends to, e.g ec2 | elb
     * @param data The request's body
     * @param headers The request's header collection
     */
    async post(uri, service, data, headers) {
        return await this.request('POST', uri, service, JSON.stringify(data), {
            ...headers,
            'content-type': 'application/json',
        });
    }
    /**
     * Send put request to remote
     * @param uri The request's uri
     * @param service The underline service this request sends to, e.g ec2 | elb
     * @param data The request's body
     * @param headers The request's header collection
     */
    async put(uri, service, data, headers) {
        return await this.request('PUT', uri, service, JSON.stringify(data), {
            ...headers,
            'content-type': 'application/json',
        });
    }
    /**
     * Send request request to remote
     * @param request type @ApjsbAwsHttpClientRequest encapsulate all the request parameters
     */
    async request(method, uri, service, data, headers) {
        const url = new nodeUrl.URL(uri);
        const hostname = url.hostname;
        const path = url.pathname;
        let queryParameters = undefined;
        url.searchParams.forEach((value, name) => {
            if (!queryParameters) {
                queryParameters = {};
            }
            queryParameters[name] = value;
        });
        let outgoingRequest;
        if (method in noPayloadRequestMethod) {
            if (data) {
                throw new Error(`Invalid parameter, request ${method} should not contain data`);
            }
            outgoingRequest = await this.createHttpRequest(hostname, path, service, method, queryParameters, undefined, headers);
        }
        else {
            outgoingRequest = await this.createHttpRequest(hostname, path, service, method, queryParameters, data, headers);
        }
        return await this.sendRequest(outgoingRequest);
    }
    async sendRequest(request) {
        if (this.customHandler) {
            return await this.customHandler(request, this.httpsAgent);
        }
        const response = (await this.httpClient.handle(request)).response;
        const body = await Deserilizer_1.parseBody(response.body);
        return {
            statusCode: response.statusCode,
            headers: response.headers,
            body: body,
        };
    }
    async createHttpRequest(hostname, path, service, method, query, data, headers) {
        const credential = await this.credentialProvider.getCredential();
        const request = this.createRequest(hostname, path, method, query, data, headers);
        loglevel_1.default.debug('original request', request);
        return this.signRequest(credential, service, request);
    }
    async signRequest(credential, service, request) {
        const signer = new signature_v4_1.SignatureV4({
            credentials: credential,
            region: this.region,
            service: service,
            sha256: sha256_js_1.Sha256,
        });
        return signer.sign(request);
    }
    createRequest(hostname, path, httpMethod, query, data, headers) {
        const request = new protocol_http_1.HttpRequest({
            method: httpMethod,
            protocol: 'https:',
            hostname,
            headers: { ...headers, host: hostname },
            query: query,
            path,
        });
        request.method = httpMethod;
        if (data) {
            request.body = data;
        }
        return request;
    }
}
exports.ApjsbAwsHttpClient = ApjsbAwsHttpClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBqc2JBd3NIdHRwY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL0FwanNiQXdzSHR0cGNsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7RUFjRTtBQUNGLHVDQUFxQztBQUNyQyxxREFBK0M7QUFDL0Msa0VBQTZEO0FBQzdELDBEQUFtRTtBQUNuRSx3REFBb0Q7QUFHcEQsMkRBQXNEO0FBQ3RELHVDQUEyQjtBQUMzQiwrQkFBK0I7QUFDL0IsMkVBQXdFO0FBRXhFOzs7Ozs7R0FNRztBQUNILFNBQWdCLGdCQUFnQixDQUM1QixNQUFjO0FBQ2QsNkRBQTZEO0FBQzdELG9CQUE2QixLQUFLLEVBQ2xDLHFCQUF5QyxJQUFJLHFEQUF5QixFQUFFLEVBQ3hFLFVBQXdCO0lBRXhCLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDMUUsQ0FBQztBQVJELDRDQVFDO0FBTUQsTUFBTSxzQkFBc0IsR0FBRztJQUMzQixLQUFLO0lBQ0wsTUFBTTtJQUNOLE9BQU87SUFDUCxTQUFTO0lBQ1QsU0FBUztJQUNULE9BQU87Q0FDRCxDQUFDO0FBRVgsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFVLENBQUM7QUFJcEU7O0dBRUc7QUFFSCxNQUFhLGtCQUFrQjtJQUczQjs7Ozs7T0FLRztJQUNILFlBQ1ksa0JBQXNDLEVBQ3RDLE1BQWMsRUFDZCxVQUF3QixFQUN4QixhQUdrQjs7UUFObEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtRQUN0QyxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBQ2QsZUFBVSxHQUFWLFVBQVUsQ0FBYztRQUN4QixrQkFBYSxHQUFiLGFBQWEsQ0FHSztRQUUxQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksbUNBQWUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7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akIsUUFBZ0IsRUFDaEIsSUFBWSxFQUNaLFVBQWtCLEVBQ2xCLEtBQXlCLEVBQ3pCLElBQVEsRUFDUixPQUFtQjtRQUVuQixNQUFNLE9BQU8sR0FBRyxJQUFJLDJCQUFXLENBQUM7WUFDNUIsTUFBTSxFQUFFLFVBQVU7WUFDbEIsUUFBUSxFQUFFLFFBQVE7WUFDbEIsUUFBUTtZQUNSLE9BQU8sRUFBRSxFQUFFLEdBQUcsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDdkMsS0FBSyxFQUFFLEtBQUs7WUFDWixJQUFJO1NBQ1AsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUM7UUFDNUIsSUFBSSxJQUFJLEVBQUU7WUFDTixPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztTQUN2QjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7Q0FDSjtBQW5NRCxnREFtTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCB7IFNoYTI1NiB9IGZyb20gJ0Bhd3MtY3J5cHRvL3NoYTI1Ni1qcyc7XG5pbXBvcnQgeyBOb2RlSHR0cEhhbmRsZXIgfSBmcm9tICdAYXdzLXNkay9ub2RlLWh0dHAtaGFuZGxlcic7XG5pbXBvcnQgeyBIdHRwUmVxdWVzdCwgSHR0cFJlc3BvbnNlIH0gZnJvbSAnQGF3cy1zZGsvcHJvdG9jb2wtaHR0cCc7XG5pbXBvcnQgeyBTaWduYXR1cmVWNCB9IGZyb20gJ0Bhd3Mtc2RrL3NpZ25hdHVyZS12NCc7XG5pbXBvcnQgeyBDcmVkZW50aWFscywgSGVhZGVyQmFnLCBRdWVyeVBhcmFtZXRlckJhZyB9IGZyb20gJ0Bhd3Mtc2RrL3R5cGVzJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCB7IHBhcnNlQm9keSB9IGZyb20gJy4vZGVzZXJpbGl6ZXIvRGVzZXJpbGl6ZXInO1xuaW1wb3J0IGxvZyBmcm9tICdsb2dsZXZlbCc7XG5pbXBvcnQgKiBhcyBub2RlVXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgeyBEZWZhdWx0Q3JlZGVudGlhbFByb3ZpZGVyIH0gZnJvbSAnLi9EZWZhdWx0Q3JlZGVudGlhbFByb3ZpZGVyJztcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGFuIEFwanNiQXdzSHR0cENsaWVudFxuICogQHBhcmFtIHJlZ2lvbiBUaGUgQVdTIHJlZ2lvblxuICogQHBhcmFtIGNvbXBhdGlibGl0eU1vZGUgSWYgc2V0IHRydWUsIHRoZSBiYXNpYyBOb2RlSlMncyBodHRwcyBoYW5kbGVyIGlzIHVzZWQgdG8gc3VibWl0IHRoZSByZXF1ZXN0IGFuZCBwcm9jZXNzIHRoZSByZXNwb25zZS4gSWYgc2V0IHRvIGZhbHNlLCB0aGUgYXdzLXNkayB2MyBOb2RlSHR0cEhhbmRsZXIgaSBzdWVkIHRvIHN1Ym1pdCB0aGUgcmVxdWVzdCBhbmQgcHJvY2VzcyB0aGUgcmVzcG9uc2UuIEBkZWZhdWx0IGZhbHNlXG4gKiBAcGFyYW0gY3JlZGVudGlhbFByb3ZpZGVyIFRoZSBjcmVkZW50aWFsIHByb3ZpZGVyLiBAZGVmYXVsdCBhd3MuRW52aXJvbm1lbnRDcmVkZW50aWFsc1xuICogQHBhcmFtIGh0dHBzQWdlbnQgVGhlIE5vZGVKUydzIEh0dHBzQWdlbnQgQGRlZmF1bHQ6IHVuZGVmaW5lZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSHR0cENsaWVudChcbiAgICByZWdpb246IHN0cmluZyxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgY29tcGF0aWJpbGl0eU1vZGU6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBjcmVkZW50aWFsUHJvdmlkZXI6IENyZWRlbnRpYWxQcm92aWRlciA9IG5ldyBEZWZhdWx0Q3JlZGVudGlhbFByb3ZpZGVyKCksXG4gICAgaHR0cHNBZ2VudD86IGh0dHBzLkFnZW50XG4pOiBBcGpzYkF3c0h0dHBDbGllbnQge1xuICAgIHJldHVybiBuZXcgQXBqc2JBd3NIdHRwQ2xpZW50KGNyZWRlbnRpYWxQcm92aWRlciwgcmVnaW9uLCBodHRwc0FnZW50KTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDcmVkZW50aWFsUHJvdmlkZXIge1xuICAgIGdldENyZWRlbnRpYWwoKTogUHJvbWlzZTxDcmVkZW50aWFscz47XG59XG5cbmNvbnN0IG5vUGF5bG9hZFJlcXVlc3RNZXRob2QgPSBbXG4gICAgJ0dFVCcsXG4gICAgJ0hFQUQnLFxuICAgICdQQVRDSCcsXG4gICAgJ0NPTk5FQ1QnLFxuICAgICdPUFRJT05TJyxcbiAgICAnVFJBQ0UnLFxuXSBhcyBjb25zdDtcbnR5cGUgTm9QYXlsb2FkUmVxdWVzdE1ldGhvZCA9IHR5cGVvZiBub1BheWxvYWRSZXF1ZXN0TWV0aG9kW251bWJlcl07XG5jb25zdCB3aXRoUGF5bG9hZFJlcXVlc3RNZXRob2QgPSBbJ1BPU1QnLCAnUFVUJywgJ0RFTEVURSddIGFzIGNvbnN0O1xudHlwZSBXaXRoUGF5bG9hZFJlcXVlc3RNZXRob2QgPSB0eXBlb2Ygd2l0aFBheWxvYWRSZXF1ZXN0TWV0aG9kW251bWJlcl07XG5leHBvcnQgdHlwZSBIdHRwTWV0aG9kID0gTm9QYXlsb2FkUmVxdWVzdE1ldGhvZCB8IFdpdGhQYXlsb2FkUmVxdWVzdE1ldGhvZDtcblxuLyoqXG4gKiBBIEh0dHAgSGFuZGxlciB0aGF0IHN1cHBvcnRzIEFXUyBWNCBzaWduYXR1cmVcbiAqL1xuXG5leHBvcnQgY2xhc3MgQXBqc2JBd3NIdHRwQ2xpZW50IHtcbiAgICBwcml2YXRlIGh0dHBDbGllbnQ6IE5vZGVIdHRwSGFuZGxlcjtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2VzIGEgbmV3IEFXUyBOb2RlSHR0cEhhbmRsZXJcbiAgICAgKiBAcGFyYW0gY3JlZGVudGlhbFByb3ZpZGVyIHRoZSBBV1MgY3JlZGVudGlhbHMgcHJvdmlkZXJcbiAgICAgKiBAcGFyYW0gcmVnaW9uIHRoZSBBV1MgcmVnaW9uXG4gICAgICogQHBhcmFtIGh0dHBzQWdlbnQgT3B0aW9uYWwgLSB0aGUgaHR0cHNBZ2VudCB0byBiZSB1c2VkXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgY3JlZGVudGlhbFByb3ZpZGVyOiBDcmVkZW50aWFsUHJvdmlkZXIsXG4gICAgICAgIHByaXZhdGUgcmVnaW9uOiBzdHJpbmcsXG4gICAgICAgIHByaXZhdGUgaHR0cHNBZ2VudD86IGh0dHBzLkFnZW50LFxuICAgICAgICBwcml2YXRlIGN1c3RvbUhhbmRsZXI/OiAoXG4gICAgICAgICAgICByZXF1ZXN0OiBIdHRwUmVxdWVzdCxcbiAgICAgICAgICAgIGFnZW50PzogaHR0cHMuQWdlbnRcbiAgICAgICAgKSA9PiBQcm9taXNlPEh0dHBSZXNwb25zZT5cbiAgICApIHtcbiAgICAgICAgdGhpcy5odHRwQ2xpZW50ID0gbmV3IE5vZGVIdHRwSGFuZGxlcih7IGh0dHBzQWdlbnQgfSk7XG4gICAgICAgIGxvZy5zZXREZWZhdWx0TGV2ZWwobG9nLmdldExldmVsKCkgPz8gJ2luZm8nKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGdldCByZXF1ZXN0IHRvIHJlbW90ZVxuICAgICAqIEBwYXJhbSB1cmkgVGhlIHJlcXVlc3QncyB1cmlcbiAgICAgKiBAcGFyYW0gc2VydmljZSBUaGUgdW5kZXJsaW5lIHNlcnZpY2UgdGhpcyByZXF1ZXN0IHNlbmRzIHRvLCBlLmcgZWMyIHwgZWxiXG4gICAgICogQHBhcmFtIHF1ZXJ5UGFyYW1ldGVycyBUaGUgcXVlcnkgcGFyYW1ldGVyIGluIHRoZSBmb3JtIG9mIGtleSB2YWx1ZSBwYWlyLFxuICAgICAqIEBwYXJhbSBoZWFkZXJzIHRoZSByZXF1ZXN0J3MgaGVhZGVyIGNvbGxlY3Rpb25cbiAgICAgKi9cbiAgICBhc3luYyBnZXQodXJpOiBzdHJpbmcsIHNlcnZpY2U6IHN0cmluZywgaGVhZGVycz86IEhlYWRlckJhZyk6IFByb21pc2U8SHR0cFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlcXVlc3QoJ0dFVCcsIHVyaSwgc2VydmljZSwgdW5kZWZpbmVkLCBoZWFkZXJzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIHBvc3QgcmVxdWVzdCB0byByZW1vdGVcbiAgICAgKiBAcGFyYW0gdXJpIFRoZSByZXF1ZXN0J3MgdXJpXG4gICAgICogQHBhcmFtIHNlcnZpY2UgVGhlIHVuZGVybGluZSBzZXJ2aWNlIHRoaXMgcmVxdWVzdCBzZW5kcyB0bywgZS5nIGVjMiB8IGVsYlxuICAgICAqIEBwYXJhbSBkYXRhIFRoZSByZXF1ZXN0J3MgYm9keVxuICAgICAqIEBwYXJhbSBoZWFkZXJzIFRoZSByZXF1ZXN0J3MgaGVhZGVyIGNvbGxlY3Rpb25cbiAgICAgKi9cbiAgICBhc3luYyBwb3N0PFQ+KFxuICAgICAgICB1cmk6IHN0cmluZyxcbiAgICAgICAgc2VydmljZTogc3RyaW5nLFxuICAgICAgICBkYXRhOiBULFxuICAgICAgICBoZWFkZXJzPzogSGVhZGVyQmFnXG4gICAgKTogUHJvbWlzZTxIdHRwUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVxdWVzdCgnUE9TVCcsIHVyaSwgc2VydmljZSwgSlNPTi5zdHJpbmdpZnkoZGF0YSksIHtcbiAgICAgICAgICAgIC4uLmhlYWRlcnMsXG4gICAgICAgICAgICAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIHB1dCByZXF1ZXN0IHRvIHJlbW90ZVxuICAgICAqIEBwYXJhbSB1cmkgVGhlIHJlcXVlc3QncyB1cmlcbiAgICAgKiBAcGFyYW0gc2VydmljZSBUaGUgdW5kZXJsaW5lIHNlcnZpY2UgdGhpcyByZXF1ZXN0IHNlbmRzIHRvLCBlLmcgZWMyIHwgZWxiXG4gICAgICogQHBhcmFtIGRhdGEgVGhlIHJlcXVlc3QncyBib2R5XG4gICAgICogQHBhcmFtIGhlYWRlcnMgVGhlIHJlcXVlc3QncyBoZWFkZXIgY29sbGVjdGlvblxuICAgICAqL1xuICAgIGFzeW5jIHB1dDxUPihcbiAgICAgICAgdXJpOiBzdHJpbmcsXG4gICAgICAgIHNlcnZpY2U6IHN0cmluZyxcbiAgICAgICAgZGF0YTogVCxcbiAgICAgICAgaGVhZGVycz86IEhlYWRlckJhZ1xuICAgICk6IFByb21pc2U8SHR0cFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlcXVlc3QoJ1BVVCcsIHVyaSwgc2VydmljZSwgSlNPTi5zdHJpbmdpZnkoZGF0YSksIHtcbiAgICAgICAgICAgIC4uLmhlYWRlcnMsXG4gICAgICAgICAgICAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIHJlcXVlc3QgcmVxdWVzdCB0byByZW1vdGVcbiAgICAgKiBAcGFyYW0gcmVxdWVzdCB0eXBlIEBBcGpzYkF3c0h0dHBDbGllbnRSZXF1ZXN0IGVuY2Fwc3VsYXRlIGFsbCB0aGUgcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIHJlcXVlc3QoXG4gICAgICAgIG1ldGhvZDogSHR0cE1ldGhvZCxcbiAgICAgICAgdXJpOiBzdHJpbmcsXG4gICAgICAgIHNlcnZpY2U6IHN0cmluZyxcbiAgICAgICAgZGF0YT86IHN0cmluZyxcbiAgICAgICAgaGVhZGVycz86IEhlYWRlckJhZ1xuICAgICk6IFByb21pc2U8SHR0cFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHVybCA9IG5ldyBub2RlVXJsLlVSTCh1cmkpO1xuXG4gICAgICAgIGNvbnN0IGhvc3RuYW1lID0gdXJsLmhvc3RuYW1lO1xuICAgICAgICBjb25zdCBwYXRoID0gdXJsLnBhdGhuYW1lO1xuICAgICAgICBsZXQgcXVlcnlQYXJhbWV0ZXJzOiBRdWVyeVBhcmFtZXRlckJhZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLmZvckVhY2goKHZhbHVlLCBuYW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXF1ZXJ5UGFyYW1ldGVycykge1xuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1ldGVycyA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBxdWVyeVBhcmFtZXRlcnNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IG91dGdvaW5nUmVxdWVzdDtcblxuICAgICAgICBpZiAobWV0aG9kIGluIG5vUGF5bG9hZFJlcXVlc3RNZXRob2QpIHtcbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBgSW52YWxpZCBwYXJhbWV0ZXIsIHJlcXVlc3QgJHttZXRob2R9IHNob3VsZCBub3QgY29udGFpbiBkYXRhYFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdXRnb2luZ1JlcXVlc3QgPSBhd2FpdCB0aGlzLmNyZWF0ZUh0dHBSZXF1ZXN0KFxuICAgICAgICAgICAgICAgIGhvc3RuYW1lLFxuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgc2VydmljZSxcbiAgICAgICAgICAgICAgICBtZXRob2QsXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzLFxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0Z29pbmdSZXF1ZXN0ID0gYXdhaXQgdGhpcy5jcmVhdGVIdHRwUmVxdWVzdChcbiAgICAgICAgICAgICAgICBob3N0bmFtZSxcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgIHNlcnZpY2UsXG4gICAgICAgICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1ldGVycyxcbiAgICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgICAgIGhlYWRlcnNcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2VuZFJlcXVlc3Qob3V0Z29pbmdSZXF1ZXN0KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNlbmRSZXF1ZXN0KHJlcXVlc3Q6IEh0dHBSZXF1ZXN0KTogUHJvbWlzZTxIdHRwUmVzcG9uc2U+IHtcbiAgICAgICAgaWYgKHRoaXMuY3VzdG9tSGFuZGxlcikge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3VzdG9tSGFuZGxlcihyZXF1ZXN0LCB0aGlzLmh0dHBzQWdlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSAoYXdhaXQgdGhpcy5odHRwQ2xpZW50LmhhbmRsZShyZXF1ZXN0KSkucmVzcG9uc2U7XG5cbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlQm9keShyZXNwb25zZS5ib2R5KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogcmVzcG9uc2Uuc3RhdHVzQ29kZSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHJlc3BvbnNlLmhlYWRlcnMsXG4gICAgICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlSHR0cFJlcXVlc3QoXG4gICAgICAgIGhvc3RuYW1lOiBzdHJpbmcsXG4gICAgICAgIHBhdGg6IHN0cmluZyxcbiAgICAgICAgc2VydmljZTogc3RyaW5nLFxuICAgICAgICBtZXRob2Q6IEh0dHBNZXRob2QsXG4gICAgICAgIHF1ZXJ5PzogUXVlcnlQYXJhbWV0ZXJCYWcsXG4gICAgICAgIGRhdGE/OiBzdHJpbmcsXG4gICAgICAgIGhlYWRlcnM/OiBIZWFkZXJCYWdcbiAgICApOiBQcm9taXNlPEh0dHBSZXF1ZXN0PiB7XG4gICAgICAgIGNvbnN0IGNyZWRlbnRpYWwgPSBhd2FpdCB0aGlzLmNyZWRlbnRpYWxQcm92aWRlci5nZXRDcmVkZW50aWFsKCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmNyZWF0ZVJlcXVlc3QoaG9zdG5hbWUsIHBhdGgsIG1ldGhvZCwgcXVlcnksIGRhdGEsIGhlYWRlcnMpO1xuICAgICAgICBsb2cuZGVidWcoJ29yaWdpbmFsIHJlcXVlc3QnLCByZXF1ZXN0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2lnblJlcXVlc3QoY3JlZGVudGlhbCwgc2VydmljZSwgcmVxdWVzdCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzaWduUmVxdWVzdChcbiAgICAgICAgY3JlZGVudGlhbDogQ3JlZGVudGlhbHMsXG4gICAgICAgIHNlcnZpY2U6IHN0cmluZyxcbiAgICAgICAgcmVxdWVzdDogSHR0cFJlcXVlc3RcbiAgICApIHtcbiAgICAgICAgY29uc3Qgc2lnbmVyID0gbmV3IFNpZ25hdHVyZVY0KHtcbiAgICAgICAgICAgIGNyZWRlbnRpYWxzOiBjcmVkZW50aWFsLFxuICAgICAgICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgICAgIHNlcnZpY2U6IHNlcnZpY2UsXG4gICAgICAgICAgICBzaGEyNTY6IFNoYTI1NixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNpZ25lci5zaWduKHJlcXVlc3QpIGFzIFByb21pc2U8SHR0cFJlcXVlc3Q+O1xuICAgIH1cblxuICAgIHByaXZhdGUgY3JlYXRlUmVxdWVzdDxUPihcbiAgICAgICAgaG9zdG5hbWU6IHN0cmluZyxcbiAgICAgICAgcGF0aDogc3RyaW5nLFxuICAgICAgICBodHRwTWV0aG9kOiBzdHJpbmcsXG4gICAgICAgIHF1ZXJ5PzogUXVlcnlQYXJhbWV0ZXJCYWcsXG4gICAgICAgIGRhdGE/OiBULFxuICAgICAgICBoZWFkZXJzPzogSGVhZGVyQmFnXG4gICAgKTogSHR0cFJlcXVlc3Qge1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gbmV3IEh0dHBSZXF1ZXN0KHtcbiAgICAgICAgICAgIG1ldGhvZDogaHR0cE1ldGhvZCxcbiAgICAgICAgICAgIHByb3RvY29sOiAnaHR0cHM6JyxcbiAgICAgICAgICAgIGhvc3RuYW1lLFxuICAgICAgICAgICAgaGVhZGVyczogeyAuLi5oZWFkZXJzLCBob3N0OiBob3N0bmFtZSB9LFxuICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5LFxuICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJlcXVlc3QubWV0aG9kID0gaHR0cE1ldGhvZDtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIHJlcXVlc3QuYm9keSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XG4gICAgfVxufVxuIl19