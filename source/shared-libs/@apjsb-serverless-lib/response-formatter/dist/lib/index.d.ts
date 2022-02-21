import { Context } from 'aws-lambda';
import middy from '@middy/core';
declare type ConfigType = {
    headers: Record<string, string>;
};
declare const ResponseFormatter: <T, R, C extends Context = Context>(config?: ConfigType) => middy.MiddlewareObject<T, R, C>;
export default ResponseFormatter;
