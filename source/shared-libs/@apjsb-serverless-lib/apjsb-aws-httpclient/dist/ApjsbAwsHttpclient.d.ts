/// <reference types="node" />
import 'source-map-support/register';
import { HttpRequest, HttpResponse } from '@aws-sdk/protocol-http';
import { Credentials, HeaderBag } from '@aws-sdk/types';
import * as https from 'https';
/**
 * Creates an instance of an ApjsbAwsHttpClient
 * @param region The AWS region
 * @param compatiblityMode If set true, the basic NodeJS's https handler is used to submit the request and process the response. If set to false, the aws-sdk v3 NodeHttpHandler i sued to submit the request and process the response. @default false
 * @param credentialProvider The credential provider. @default aws.EnvironmentCredentials
 * @param httpsAgent The NodeJS's HttpsAgent @default: undefined
 */
export declare function createHttpClient(region: string, compatibilityMode?: boolean, credentialProvider?: CredentialProvider, httpsAgent?: https.Agent): ApjsbAwsHttpClient;
export interface CredentialProvider {
    getCredential(): Promise<Credentials>;
}
declare const noPayloadRequestMethod: readonly ["GET", "HEAD", "PATCH", "CONNECT", "OPTIONS", "TRACE"];
declare type NoPayloadRequestMethod = typeof noPayloadRequestMethod[number];
declare const withPayloadRequestMethod: readonly ["POST", "PUT", "DELETE"];
declare type WithPayloadRequestMethod = typeof withPayloadRequestMethod[number];
export declare type HttpMethod = NoPayloadRequestMethod | WithPayloadRequestMethod;
/**
 * A Http Handler that supports AWS V4 signature
 */
export declare class ApjsbAwsHttpClient {
    private credentialProvider;
    private region;
    private httpsAgent?;
    private customHandler?;
    private httpClient;
    /**
     * Initialises a new AWS NodeHttpHandler
     * @param credentialProvider the AWS credentials provider
     * @param region the AWS region
     * @param httpsAgent Optional - the httpsAgent to be used
     */
    constructor(credentialProvider: CredentialProvider, region: string, httpsAgent?: https.Agent | undefined, customHandler?: ((request: HttpRequest, agent?: https.Agent | undefined) => Promise<HttpResponse>) | undefined);
    /**
     * Send get request to remote
     * @param uri The request's uri
     * @param service The underline service this request sends to, e.g ec2 | elb
     * @param queryParameters The query parameter in the form of key value pair,
     * @param headers the request's header collection
     */
    get(uri: string, service: string, headers?: HeaderBag): Promise<HttpResponse>;
    /**
     * Send post request to remote
     * @param uri The request's uri
     * @param service The underline service this request sends to, e.g ec2 | elb
     * @param data The request's body
     * @param headers The request's header collection
     */
    post<T>(uri: string, service: string, data: T, headers?: HeaderBag): Promise<HttpResponse>;
    /**
     * Send put request to remote
     * @param uri The request's uri
     * @param service The underline service this request sends to, e.g ec2 | elb
     * @param data The request's body
     * @param headers The request's header collection
     */
    put<T>(uri: string, service: string, data: T, headers?: HeaderBag): Promise<HttpResponse>;
    /**
     * Send request request to remote
     * @param request type @ApjsbAwsHttpClientRequest encapsulate all the request parameters
     */
    request(method: HttpMethod, uri: string, service: string, data?: string, headers?: HeaderBag): Promise<HttpResponse>;
    private sendRequest;
    private createHttpRequest;
    private signRequest;
    private createRequest;
}
export {};
