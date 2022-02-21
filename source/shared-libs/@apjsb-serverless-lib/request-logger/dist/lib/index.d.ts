import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { ContextLogger, Logger } from '@apjsb-serverless-lib/logger';
export interface RequestContext extends Context {
    requestLogger: ContextLogger;
}
export declare const prettyStringify: (value: any) => string;
declare const RequestLogger: <T, R, C extends Context = Context>(applicationLogger: Logger) => middy.MiddlewareObject<T, R, C>;
export default RequestLogger;
