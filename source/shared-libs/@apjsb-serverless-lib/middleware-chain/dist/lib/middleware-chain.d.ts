import { Context, Callback } from 'aws-lambda';
import middy from '@middy/core';
export declare type LambdaHandler<T, R, C extends Context = Context> = (event: T, context: C, callback: Callback<R>) => void | Promise<R>;
declare type AsyncHandler<T, R, C extends Context> = (event: T, context: C) => Promise<R>;
export interface AsyncHandlerObj<T, R, C extends Context = Context> {
    handle: AsyncHandler<T, R, C>;
}
export declare class MiddlewareChain<T, R, C extends Context = Context> {
    readonly lambdaHandler: LambdaHandler<T, R, C>;
    constructor(asyncHandlerObj: AsyncHandlerObj<T, R, C>, middlewares: middy.MiddlewareObject<T, R>[]);
}
export {};
