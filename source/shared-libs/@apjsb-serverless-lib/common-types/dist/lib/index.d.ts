import { APIGatewayProxyResult } from 'aws-lambda';
export declare class BasicHttpResponse implements APIGatewayProxyResult {
    statusCode: number;
    body: string;
    headers?: Record<string, string | number | boolean> | undefined;
    constructor(statusCode: number, body?: string, headers?: Record<string, string | number | boolean> | undefined);
    addHeaders(headers: Record<string, boolean | number | string>): BasicHttpResponse;
    static ofError(error: BasicHttpError): BasicHttpResponse;
    static ofRecord(statusCode: number, data: Record<string, unknown>): BasicHttpResponse;
    static ofString(statusCode: number, message: string): BasicHttpResponse;
    static ofObject<T>(statusCode: number, value: T): BasicHttpResponse;
}
export declare class BasicHttpError implements Error {
    statusCode: number;
    message: string;
    retryable: boolean;
    name: string;
    constructor(statusCode: number, message?: string, retryable?: boolean);
    static internalServerError(message: string): BasicHttpError;
}
export interface PaginatedResults<T> {
    results: T[];
    nextToken?: string;
}
